import { Metadata } from 'next'

type GetMetadataArgs = {
  title: string
  skipRootLabel?: boolean
  description?: string
}

export function getMetadata({
  title,
  description,
  skipRootLabel = false,
}: GetMetadataArgs): Metadata {
  return {
    title: skipRootLabel ? title : `${title} | Pulpit`,
    description,
  }
}
