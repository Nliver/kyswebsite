import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { v2 as cloudinary } from 'cloudinary'

const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp'
])
const DEFAULT_FOLDER = 'kyswebsite/static'
const CONCURRENCY = 4

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const publicDirectory = path.join(projectRoot, 'public')

function getEnvironmentValue(serverName, legacyPublicName) {
  return process.env[serverName] || process.env[legacyPublicName] || ''
}

function normalizeFolder(value) {
  const folder = value.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')

  if (!folder || folder.split('/').includes('..')) {
    throw new Error(`Invalid CLOUDINARY_STATIC_FOLDER: ${value}`)
  }

  return folder
}

async function findImageFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return findImageFiles(entryPath)
      }

      if (
        entry.isFile() &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        return [entryPath]
      }

      return []
    })
  )

  return nestedFiles.flat()
}

function toAsset(filePath, folder) {
  const relativePath = path
    .relative(publicDirectory, filePath)
    .split(path.sep)
    .join('/')

  if (!/^[A-Za-z0-9._/-]+$/.test(relativePath)) {
    throw new Error(
      `Static image paths may only contain letters, numbers, dots, dashes and underscores: ${relativePath}`
    )
  }

  const extension = path.posix.extname(relativePath)

  return {
    filePath,
    relativePath,
    publicId: `${folder}/${relativePath.slice(0, -extension.length)}`
  }
}

async function getRemoteAssets(folder) {
  const assets = new Map()
  let nextCursor

  do {
    const response = await cloudinary.api.resources({
      resource_type: 'image',
      type: 'upload',
      prefix: `${folder}/`,
      max_results: 500,
      context: true,
      next_cursor: nextCursor
    })

    for (const resource of response.resources || []) {
      assets.set(resource.public_id, resource)
    }

    nextCursor = response.next_cursor
  } while (nextCursor)

  return assets
}

async function getFileHash(filePath) {
  const content = await readFile(filePath)
  return createHash('sha256').update(content).digest('hex')
}

async function runWithConcurrency(items, worker) {
  let nextIndex = 0

  async function runWorker() {
    while (nextIndex < items.length) {
      const item = items[nextIndex]
      nextIndex += 1
      await worker(item)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, () =>
      runWorker()
    )
  )
}

async function main() {
  if (process.argv.includes('--help')) {
    console.log('Usage: npm run images:sync')
    console.log('Uploads new or changed images under public/ to Cloudinary.')
    return
  }

  const cloudName = getEnvironmentValue(
    'CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
  )
  const apiKey = getEnvironmentValue(
    'CLOUDINARY_API_KEY',
    'NEXT_PUBLIC_CLOUDINARY_API_KEY'
  )
  const apiSecret = getEnvironmentValue(
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_API_SECRET'
  )
  const missingVariables = [
    ['CLOUDINARY_CLOUD_NAME', cloudName],
    ['CLOUDINARY_API_KEY', apiKey],
    ['CLOUDINARY_API_SECRET', apiSecret]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(', ')}`
    )
  }

  const folder = normalizeFolder(
    process.env.CLOUDINARY_STATIC_FOLDER || DEFAULT_FOLDER
  )

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  })

  const filePaths = (await findImageFiles(publicDirectory)).sort()
  const assets = filePaths.map((filePath) => toAsset(filePath, folder))
  const publicIds = new Set()

  for (const asset of assets) {
    if (publicIds.has(asset.publicId)) {
      throw new Error(
        `Static images with different extensions cannot share a path: ${asset.publicId}`
      )
    }

    publicIds.add(asset.publicId)
  }

  const remoteAssets = await getRemoteAssets(folder)
  const changedAssets = []

  for (const asset of assets) {
    const sourceHash = await getFileHash(asset.filePath)
    const remoteHash = remoteAssets.get(asset.publicId)?.context?.custom
      ?.source_sha256

    if (sourceHash !== remoteHash) {
      changedAssets.push({ ...asset, sourceHash })
    }
  }

  await runWithConcurrency(changedAssets, async (asset) => {
    await cloudinary.uploader.upload(asset.filePath, {
      resource_type: 'image',
      public_id: asset.publicId,
      overwrite: true,
      invalidate: true,
      unique_filename: false,
      use_filename: false,
      tags: ['kyswebsite-static'],
      context: {
        source_path: asset.relativePath,
        source_sha256: asset.sourceHash
      }
    })
    console.log(`Uploaded ${asset.relativePath}`)
  })

  console.log(
    `Cloudinary static assets are current: ${changedAssets.length} uploaded, ${assets.length - changedAssets.length} unchanged.`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
