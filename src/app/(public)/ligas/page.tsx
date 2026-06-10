import { permanentRedirect } from "next/navigation";

/** Alias legado → directorio en `/`. */
export default function ProgramLeaguesLegacyAliasPage() {
  permanentRedirect("/");
}
