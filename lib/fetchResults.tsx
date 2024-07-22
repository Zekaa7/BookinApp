import { SearchParams } from "@/app/search/page";
import { Result } from "@/typings";

export async function fetchResults(searchParams: SearchParams) {
  const username = process.env.OXYLABS_USERNAME;
  const password = process.env.OXYLABS_PASSWORD;

  if (!username || !password) {
    throw new Error("Oxylabs credentials are missing");
  }

  const url = new URL(searchParams.url);
  Object.keys(searchParams).forEach((key) => {
    if (key === "url" || key === "location") return;

    const value = searchParams[key as keyof SearchParams];

    if (typeof value === "string") {
      url.searchParams.append(key, value);
    }
  });

  console.log("scraping url >>>", url.href);

  const body = {
    source: "universal",
    url: url.href,
    parse: true,
    render: "html",
    parsing_instructions: {
      listings: {
        _fns: [
          {
            _fn: "xpath",
            _args: ["//div[@data-testid='property-card-container']"],
          },
        ],
        _items: {
          title: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//div[@data-testid='title']/text()"],
              },
            ],
          },
          description: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//div[@class='c0ade187b1']/h4[@role='link']/text()"],
              },
            ],
          },
          booking_metadata: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'e8acaa0d22') and contains(@class, 'ab107395cb')]/text()",
                ],
              },
            ],
          },
          link: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'c269bf01b2') and contains(@class, 'ef5f374015')]//a/@href",
                ],
              },
            ],
          },
          price: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//span[contains(@class, 'e037993315') and contains(@class, 'ab91cb3011') and contains(@class, 'd9315e4fb0')]/text()",
                ],
              },
            ],
          },

          url: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [".//img/@src"],
              },
            ],
          },
          rating_word: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'd0522b0cca') and contains(@class, 'eb02592978') and contains(@class, 'f374b67e8c')]/text()",
                ],
              },
            ],
          },
          rating: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'd0522b0cca') and contains(@class, 'fd44f541d8')]//div[contains(@class, 'a447b19dfd')]/text()",
                ],
              },
            ],
          },
          rating_count: {
            _fns: [
              {
                _fn: "xpath_one",
                _args: [
                  ".//div[contains(@class, 'e8acaa0d22') and contains(@class, 'ab107395cb') and contains(@class, 'c60bada9e4')]/text()",
                ],
              },
            ],
          },
        },
      },
      total_listings: {
        _fns: [
          {
            _fn: "xpath_one",
            _args: [".//h1/text()"],
          },
        ],
      },
    },
  };

  try {
    const response = await fetch("https://realtime.oxylabs.io/v1/queries", {
      method: "POST",
      body: JSON.stringify(body),
      next: {
        revalidate: 60 * 60, // cache for 1 hour
      },
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
      },
    });

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null; // or throw an error if you prefer
    }

    const result: Result = data.results[0];
    return result;
  } catch (error) {
    console.error("Error fetching results:", error);
    return null; // or rethrow the error if you prefer
  }
}
