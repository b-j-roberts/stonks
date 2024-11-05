package routes

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strconv"

	"github.com/b-j-roberts/stonks/backend/core"
	routeutils "github.com/b-j-roberts/stonks/backend/routes/utils"
)

func InitBaseRoutes() {
  http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    routeutils.SetupHeaders(w)
    w.WriteHeader(http.StatusOK)
  })
}

func InitContractRoutes() {
  http.HandleFunc("/get-stonks-contract-address", getStonksContractAddress)
  http.HandleFunc("/set-stonks-contract-address", setStonksContractAddress)
}

func getStonksContractAddress(w http.ResponseWriter, r *http.Request) {
  contractAddress := os.Getenv("STONKS_CONTRACT_ADDRESS")
  routeutils.WriteDataJson(w, "\""+contractAddress+"\"")
}

func setStonksContractAddress(w http.ResponseWriter, r *http.Request) {
  // Only allow admin to set contract address
  if routeutils.AdminMiddleware(w, r) {
    return
  }

  data, err := io.ReadAll(r.Body)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusBadRequest, "Failed to read request body")
    return
  }
  os.Setenv("STONKS_CONTRACT_ADDRESS", string(data))
  routeutils.WriteResultJson(w, "Stonks contract address set")
}

func InitStonksRoutes() {
  http.HandleFunc("/get-stonks", getStonks)
  http.HandleFunc("/get-user-balances", getUserBalances)
  if !core.StonksBackend.BackendConfig.Production {
    http.HandleFunc("/claim-stonk-devnet", ClaimStonkDevnet)
  }
}

type Stonk struct {
  Id     int    `json:"id"`
  Name   string `json:"name"`
  Symbol string `json:"symbol"`
  Denom  int    `json:"denom"`
}

func getStonks(w http.ResponseWriter, r *http.Request) {
  /*
    CREATE TABLE Stonks (
    id integer NOT NULL PRIMARY KEY,
    address char(64) NOT NULL,
    name TEXT NOT NULL,
    SYMBOL TEXT NOT NULL,
    denom int NOT NULL
  );
  */
  stonks, err := core.PostgresQueryJson[Stonk]("SELECT id, name, symbol, denom FROM Stonks ORDER BY id")
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get stonks")
    return
  }

  routeutils.WriteDataJson(w, string(stonks))
}

type StonkBalance struct {
  StonkId int `json:"stonkId"`
  Balance int `json:"balance"`
}

type UserBalances struct {
  SpendingPower int `json:"spendingPower"`
  StonkBalances []StonkBalance `json:"stonkBalances"`
}

func getUserBalances(w http.ResponseWriter, r *http.Request) {
  userAddress := r.URL.Query().Get("address")
  if userAddress == "" {
    routeutils.WriteErrorJson(w, http.StatusBadRequest, "No user address provided")
    return
  }
  /*
  CREATE TABLE UserStonks (
    user_address char(64) NOT NULL,
    stonk_id int NOT NULL,
    balance int NOT NULL,
    PRIMARY KEY (user_address, stonk_id),
    FOREIGN KEY (stonk_id) REFERENCES Stonks(id)
  );
  */
  stonkBalances, err := core.PostgresQuery[StonkBalance]("SELECT stonk_id, balance FROM UserStonks WHERE user_address = $1", userAddress)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get user stonk balances")
    return
  }

  /*
  CREATE TABLE UserSpendingPower (
  user_address char(64) NOT NULL PRIMARY KEY,
  spending_power int NOT NULL
  );
  */
  spendingPower, err := core.PostgresQueryOne[int]("SELECT COALESCE((SELECT spending_power FROM UserSpendingPower WHERE user_address = $1), 0)", userAddress)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to get user spending power")
    return
  }

  userBalances := UserBalances{
    SpendingPower: *spendingPower,
    StonkBalances: stonkBalances,
  }
  userBalancesJson, err := json.Marshal(userBalances)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to marshal user balances")
    return
  }

  routeutils.WriteDataJson(w, string(userBalancesJson))
}

func ClaimStonkDevnet(w http.ResponseWriter, r *http.Request) {
  // Disable this in production
  if routeutils.NonProductionMiddleware(w, r) {
    return
  }

  jsonBody, err := routeutils.ReadJsonBody[map[string]string](r)
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid JSON request body")
    return
  }

  stonkId, err := strconv.Atoi((*jsonBody)["stonkId"])
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusBadRequest, "Invalid stonk ID")
    return
  }

  shellCmd := core.StonksBackend.BackendConfig.Scripts.ClaimStonkDevnet
  contract := os.Getenv("STONKS_CONTRACT_ADDRESS")

  cmd := exec.Command(shellCmd, contract, "claim", strconv.Itoa(stonkId))
  _, err = cmd.Output()
  if err != nil {
    routeutils.WriteErrorJson(w, http.StatusInternalServerError, "Failed to claim stonk")
    return
  }

  routeutils.WriteResultJson(w, "Stonk claimed")
}

func InitRoutes() {
  InitBaseRoutes()
  InitStonksRoutes()
  InitContractRoutes()
}
