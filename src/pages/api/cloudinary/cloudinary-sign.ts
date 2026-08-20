import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from './cloudinaryConfig';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDERS || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    return res.status(500).json({ error: 'Cloudinary is not configured' });
  }

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  res.status(200).json({ signature, timestamp });
}
