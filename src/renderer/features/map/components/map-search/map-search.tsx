import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/button/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from "@/components/dropdown-menu/dropdown-menu";
import { Input } from "@/components/form-control/form-control";
import { Tooltip } from "@/components/tooltip/tooltip";
import { mapSearchUrl, parsePhotonResults } from "@/features/map/logic/search-model";
import type { MapSearchResult } from "@/features/map/map.types";
import "./map-search.css";

export function MapSearch({ onSelect }: { onSelect: (result: MapSearchResult) => void }) {
  const cache = useRef(new Map<string, MapSearchResult[]>());
  const request = useRef<AbortController | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const search = useCallback(async (rawQuery: string, reportError = false) => {
    const normalized = rawQuery.trim().replace(/\s+/g, " ");
    if (normalized.length < 2) return;
    request.current?.abort();
    const cacheKey = normalized.toLocaleLowerCase();
    const cached = cache.current.get(cacheKey);
    setOpen(true);
    if (cached) {
      setResults(cached);
      setState(cached.length ? "idle" : "empty");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setState("loading");
    try {
      const url = new URL(mapSearchUrl);
      url.searchParams.set("q", normalized);
      url.searchParams.set("limit", "6");
      url.searchParams.set("lang", navigator.language.split("-")[0] || "en");
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Search unavailable (${response.status})`);
      const parsed = parsePhotonResults(await response.json());
      cache.current.set(cacheKey, parsed);
      setResults(parsed);
      setState(parsed.length ? "idle" : "empty");
    } catch (error) {
      if (controller.signal.aborted) return;
      setState("error");
      if (reportError) {
        toast.error(`! ${error instanceof Error ? error.message : "Map search failed"}`);
      }
    }
  }, []);
  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (normalized.length < 2) {
      request.current?.abort();
      setOpen(false);
      setResults([]);
      setState("idle");
      return;
    }

    const timer = window.setTimeout(() => {
      void search(normalized);
    }, 1_000);

    return () => window.clearTimeout(timer);
  }, [query, search]);

  useEffect(() => () => request.current?.abort(), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void search(query, true);
  };
  return (
    <div className="map-search" onPointerDown={(event) => event.stopPropagation()}>
      <Dropdown open={open} onOpenChange={setOpen} modal={false}>
        <form className="map-search-form" onSubmit={submit}>
          <Search className="map-search-leading" size={15} />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(false);
            }}
            placeholder="Search any place or address…"
            aria-label="Search the map"
            autoComplete="off"
          />
          <Tooltip label="Search map">
            <DropdownTrigger asChild>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={query.trim().length < 2}
                aria-label="Search map"
              >
                {state === "loading"
                  ? <LoaderCircle className="map-search-spinner" size={14} />
                  : <Search size={14} />}
              </Button>
            </DropdownTrigger>
          </Tooltip>
        </form>
        <DropdownContent
          className="map-search-results"
          align="end"
          side="bottom"
          sideOffset={7}
          avoidCollisions={false}
        >
          <div className="map-search-menu">
            {state === "loading" && !results.length && <p>Searching places…</p>}
            {state === "empty" && <p>No matching places found.</p>}
            {state === "error" && <p>Search is temporarily unavailable.</p>}
            {results.map((result) => (
              <DropdownItem
                key={result.id}
                onSelect={() => {
                  onSelect(result);
                  setOpen(false);
                }}
              >
                <span className="map-search-result">
                  <strong>{result.label}</strong>
                  {result.detail && <small>{result.detail}</small>}
                </span>
              </DropdownItem>
            ))}
          </div>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
