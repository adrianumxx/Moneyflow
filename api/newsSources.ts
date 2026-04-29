export interface NewsArticle {
  title: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  category?: 'macro' | 'geopolitics' | 'markets' | 'energy' | 'currency' | 'crypto' | 'local';
  summary?: string;
}

export interface NewsProvider {
  name: string;
  fetchSignals(context: any): Promise<NewsArticle[]>;
}

class GDELTProvider implements NewsProvider {
  name = "GDELT";

  async fetchSignals(context: any): Promise<NewsArticle[]> {
    try {
      const country = context?.userProfile?.country || 'global';
      const currency = context?.userProfile?.baseCurrency || 'EUR';
      const query = `(finance OR economy OR geopolitics) AND (country:${country} OR "${currency}")`;
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&format=json&maxrecords=6&timespan=24h`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return [];
      const data = await response.json();
      
      if (!data.articles) return [];

      return data.articles.map((art: any) => ({
        title: art.title,
        source: art.sourceurl?.split('/')[2] || art.domain,
        url: art.url,
        publishedAt: art.seendate,
        category: 'macro', // Default for GDELT macro/geo query
        summary: art.title // GDELT artlist doesn't provide snippets in JSON mode easily
      }));
    } catch (err) {
      console.warn("GDELT fetch failed or timed out:", err);
      return [];
    }
  }
}

interface CacheEntry {
  articles: NewsArticle[];
  timestamp: number;
}

const newsCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function getRelevantNewsSignals(userContext: any): Promise<NewsArticle[]> {
  const providerType = process.env.NEWS_PROVIDER?.toLowerCase();
  const country = userContext?.userProfile?.country || 'global';
  const currency = userContext?.userProfile?.baseCurrency || 'EUR';
  const mode = userContext?.userProfile?.financialMode || 'balanced';
  
  const cacheKey = `${providerType}_${country}_${currency}_${mode}`;
  const now = Date.now();

  try {
    const configuredProviders: NewsProvider[] = [];

    if (providerType === 'gdelt') {
      configuredProviders.push(new GDELTProvider());
    }
    
    if (configuredProviders.length === 0) {
      return [];
    }

    // Return fresh cache if available
    if (newsCache[cacheKey] && (now - newsCache[cacheKey].timestamp < CACHE_TTL)) {
      return newsCache[cacheKey].articles;
    }

    const allSignals = await Promise.all(
      configuredProviders.map(p => p.fetchSignals(userContext).catch(err => {
        console.error(`Provider ${p.name} failed:`, err);
        return [];
      }))
    );

    const merged = allSignals.flat().slice(0, 6);

    // Update cache if we got new results
    if (merged.length > 0) {
      newsCache[cacheKey] = { articles: merged, timestamp: now };
    } else if (newsCache[cacheKey]) {
      // If fetch failed/empty but we have a stale cache, return it as safety buffer
      return newsCache[cacheKey].articles;
    }

    return merged;
  } catch (error) {
    console.error("News Signals Error:", error);
    // Safety: return stale cache on hard error if exists
    return newsCache[cacheKey]?.articles || [];
  }
}
