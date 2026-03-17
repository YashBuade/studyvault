import type { Metadata } from "next";

export const SITE_NAME = "StudyVault";
export const SITE_URL = "https://studyvault-4kbp.vercel.app";

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  openGraph?: Metadata["openGraph"];
  robots?: Metadata["robots"];
};

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function buildMetadata({ title, description, path, openGraph, robots }: BuildMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    ...(openGraph ? { openGraph } : {}),
    ...(robots ? { robots } : {}),
  };
}

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
