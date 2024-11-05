package main

import (
	"flag"

	"github.com/b-j-roberts/stonks/backend/config"
	"github.com/b-j-roberts/stonks/backend/core"
	"github.com/b-j-roberts/stonks/backend/routes"
)

func isFlagSet(name string) bool {
  found := false
  flag.Visit(func(f *flag.Flag) {
    if f.Name == name {
      found = true
    }
  })
  return found
}

func main() {
  databaseConfigFilename := flag.String("database-config", config.DefaultDatabaseConfigPath, "Database config file")
  backendConfigFilename := flag.String("backend-config", config.DefaultBackendConfigPath, "Backend config file")
  production := flag.Bool("production", false, "Production mode")
  admin := flag.Bool("admin", false, "Admin mode")

  flag.Parse()

  databaseConfig, err := config.LoadDatabaseConfig(*databaseConfigFilename)
  if err != nil {
    panic(err)
  }

  backendConfig, err := config.LoadBackendConfig(*backendConfigFilename)
  if err != nil {
    panic(err)
  }

  if isFlagSet("production") {
    backendConfig.Production = *production
  }

  databases := core.NewDatabases(databaseConfig)
  defer databases.Close()

  core.StonksBackend = core.NewBackend(databases, backendConfig, *admin)

  routes.InitRoutes()

  core.StonksBackend.Start(core.StonksBackend.BackendConfig.Port)
}
