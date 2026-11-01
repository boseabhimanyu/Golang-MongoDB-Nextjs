
import api from "@/lib/api";
import type { Metadata } from "next";
import axios from "axios";
import PublicPage from "@/components/pages/public-page";
import type { Page } from "@/lib/types";
import DefaultHomepage from "./components/default-homepage";

type HomepageResponse = {
  page: Page;
};

type HomepageErrorResponse = {
  error: string;
};

async function getHomepage(): Promise<Page | null> {
  try {
    const { data } = await api.get<HomepageResponse | HomepageErrorResponse>(
      "/pages/homepage"
    );

    if ("page" in data) {
      return data.page;
    }

    if (data.error === "homepage not configured") {
      return null;
    }

    throw new Error("Unexpected homepage API response");
  } catch (error) {
    if (
      axios.isAxiosError<HomepageErrorResponse>(error) &&
      error.response?.data?.error === "homepage not configured"
    ) {
      return null;
    }

    throw error;
  }
}

export const metadata: Metadata = {
  title: "Homepage",
};

export default async function Home() {
  const homepage = await getHomepage();

  if (homepage) {
    return <PublicPage page={homepage} />;
  }

  return <DefaultHomepage />;
}