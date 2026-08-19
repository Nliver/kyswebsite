import type { NextConfig } from 'next'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

const CLOUDINARY_IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webp'
])
const DEFAULT_CLOUDINARY_STATIC_FOLDER = 'kyswebsite/static'

async function findStaticImages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return findStaticImages(entryPath)
      }

      if (
        entry.isFile() &&
        CLOUDINARY_IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ) {
        return [entryPath]
      }

      return []
    })
  )

  return nestedFiles.flat()
}

function encodeCloudinaryPath(value: string) {
  return value.split('/').map(encodeURIComponent).join('/')
}

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  typescript: {
    ignoreBuildErrors: true // 忽略 TypeScript 检查
  },
  turbopack: {
    root: process.cwd()
  },
  // 优化Webpack构建
  webpack: (config: any, { dev }: { dev: boolean; isServer: boolean }) => {
    // 生产环境优化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // 限制并发构建任务
        minimize: true,
        // 启用代码分割优化
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all'
            }
          }
        }
      }
      // 限制CPU使用
      config.parallelism = 2
    }
    return config
  },
  reactStrictMode: true,
  transpilePackages: [
    '@ant-design',
    'antd',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-input'
  ],
  i18n: {
    locales: ['zh-CN', 'zh-TW', 'en'],
    defaultLocale: 'zh-CN',
    localeDetection: false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  async redirects() {
    if (process.env.CLOUDINARY_STATIC_ASSETS !== 'true') {
      return []
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!cloudName) {
      throw new Error(
        'CLOUDINARY_STATIC_ASSETS requires CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
      )
    }

    const publicDirectory = path.join(process.cwd(), 'public')
    const folder = (
      process.env.CLOUDINARY_STATIC_FOLDER || DEFAULT_CLOUDINARY_STATIC_FOLDER
    ).replace(/^\/+|\/+$/g, '')

    if (!folder || folder.split('/').includes('..')) {
      throw new Error(
        `Invalid CLOUDINARY_STATIC_FOLDER: ${process.env.CLOUDINARY_STATIC_FOLDER}`
      )
    }

    const files = await findStaticImages(publicDirectory)

    return files.map((file) => {
      const relativePath = path
        .relative(publicDirectory, file)
        .split(path.sep)
        .join('/')

      if (!/^[A-Za-z0-9._/-]+$/.test(relativePath)) {
        throw new Error(
          `Static image paths may only contain letters, numbers, dots, dashes and underscores: ${relativePath}`
        )
      }

      return {
        source: `/${relativePath}`,
        destination: `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${encodeCloudinaryPath(`${folder}/${relativePath}`)}`,
        permanent: true
      }
    })
  },
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/img/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ]
      }
    ]
  }
}

export default nextConfig
