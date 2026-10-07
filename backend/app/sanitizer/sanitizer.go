package sanitizer

import "github.com/microcosm-cc/bluemonday"

var policy = bluemonday.NewPolicy()

func init() {
	policy.AllowElements(
		"p",
		"br",
		"strong",
		"em",
		"h1",
		"h2",
		"h3",
		"ul",
		"ol",
		"li",
		"blockquote",
		"a",
		"img",
	)

	// Links
	policy.AllowAttrs("href").OnElements("a")

	//policy.AllowStandardURLs()

	//only allow from https urls
	policy.AllowURLSchemes("https")

	// Images
	policy.AllowAttrs(
		"src",
		"alt",
		"width",
		"height",
	).OnElements("img")

	// Inline styles
	policy.AllowAttrs("style").OnElements(
		"p",
		"h1",
		"h2",
		"h3",
		"img",
	)

	// Text alignment
	policy.AllowStyles("text-align").
		MatchingEnum("left", "right", "center", "justify").
		OnElements("p", "h1", "h2", "h3")

	// Image positioning
	policy.AllowStyles("float").
		MatchingEnum("left", "right", "none").
		OnElements("img")
}

func Sanitize(input string) string {
	return policy.Sanitize(input)
}
