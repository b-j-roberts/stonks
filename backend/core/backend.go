package core

import (
	"fmt"
	"net/http"

	"github.com/b-j-roberts/stonks/backend/config"
)

type Backend struct {
	Databases         *Databases

	BackendConfig *config.BackendConfig

	AdminMode bool
}

var StonksBackend *Backend

func NewBackend(databases *Databases, backendConfig *config.BackendConfig, adminMode bool) *Backend {
	return &Backend{
		Databases:     databases,
		BackendConfig: backendConfig,
		AdminMode:     adminMode,
	}
}

func (b *Backend) Start(port int) {
	fmt.Println("Listening on port", port)
	http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
	fmt.Println("Port closed")
}

func (b *Backend) GetBackendUrl() string {
	if b.BackendConfig.Production {
		return "https://api.foc.fun/stonks"
	} else {
		return fmt.Sprintf("http://%s:%d", b.BackendConfig.Host, b.BackendConfig.Port)
	}
}

