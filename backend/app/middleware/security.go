package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/unrolled/secure"
)

func SecurityMiddleware() gin.HandlerFunc {
	isDev := os.Getenv("ENV") == "development" || os.Getenv("APP_ENV") == "development"

	sec := secure.New(secure.Options{
		// Prevent browsers from MIME-sniffing the content type
		ContentTypeNosniff: true,

		// Prevent clickjacking via iframes
		FrameDeny: true,

		// Filter XSS on older browsers
		BrowserXssFilter: true,

		// Referrer policy
		ReferrerPolicy: "strict-origin-when-cross-origin",

		// HTTPS / HSTS options (disabled in local dev)
		IsDevelopment: isDev,

		// Render handles HTTPS redirection.
		SSLRedirect: false,

		// Keep HSTS enabled in production.
		STSSeconds:           31536000,
		STSIncludeSubdomains: !isDev, // 1 year
		STSPreload:           !isDev,
	})

	return func(c *gin.Context) {
		// Process sets headers and handles SSL redirects if enabled
		if err := sec.Process(c.Writer, c.Request); err != nil {
			c.Abort()
			return
		}

		// Continue downstream handlers
		c.Next()
	}
}
