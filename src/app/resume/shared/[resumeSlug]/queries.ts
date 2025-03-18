import type { ResumeData } from '../../../(app)/dashboard/resume/types'
import bcrypt from 'bcryptjs'
import CryptoJS from 'crypto-js'
import { env } from '~/lib/env'

const ENCRYPTION_KEY = env.NEXT_PUBLIC_ENCRYPTION_KEY

// Function to decrypt resume data
export function decryptResumeData(encryptedData: string): ResumeData {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8)
    if (!decryptedStr) {
      throw new Error('Decryption failed')
    }
    return JSON.parse(decryptedStr)
  } catch (error) {
    throw new Error('Invalid resume data')
    console.log(error)
  }
}

// Function to verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
