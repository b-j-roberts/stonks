package indexer

import (
	"context"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/b-j-roberts/stonks/backend/core"
	routeutils "github.com/b-j-roberts/stonks/backend/routes/utils"
)

func InitIndexerRoutes() {
	http.HandleFunc("/consume-indexer-msg", consumeIndexerMsg)
}

type IndexerCursor struct {
	OrderKey  int    `json:"orderKey"`
	UniqueKey string `json:"uniqueKey"`
}

type IndexerEvent struct {
	Event struct {
		FromAddress string   `json:"fromAddress"`
		Keys        []string `json:"keys"`
		Data        []string `json:"data"`
	} `json:"event"`
}

type IndexerMessage struct {
	Data struct {
		Cursor    IndexerCursor `json:"cursor"`
		EndCursor IndexerCursor `json:"end_cursor"`
		Finality  string        `json:"finality"`
		Batch     []struct {
			Status string         `json:"status"`
			Events []IndexerEvent `json:"events"`
		} `json:"batch"`
	} `json:"data"`
}

// TODO: When will there be multiple events in a batch?

// TODO: Pointers?
// TODO: Load on init
var LatestPendingMessage *IndexerMessage
var LastProcessedPendingMessage *IndexerMessage
var PendingMessageLock = &sync.Mutex{}
var LastAcceptedEndKey int
var AcceptedMessageQueue []IndexerMessage
var AcceptedMessageLock = &sync.Mutex{}
var LastFinalizedCursor int
var FinalizedMessageQueue []IndexerMessage
var FinalizedMessageLock = &sync.Mutex{}

const (
    newStonkEvent     = "0x03755b6d3f48992af15de25f545ee92c3cb4205c6b24d1aa65d93701bc3d63f9"
    stonkClaimedEvent = "0x00e6009859f4b71dc66d2c774b2dc0852fce0cc94eb683969fdd8da1a07788fc"
)

func processNewStonkEvent(event IndexerEvent) {
  /*
   pub id: u64,
   pub address: ContractAddress,
   pub metadata: StonkToken::InitParams,
     pub name: ByteArray,
     pub symbol: ByteArray,
     pub denomination: u256
  */
  /* example
  [0xevent 0x01] [ 0x0608c14d506fda54d1078ec37d3d517121631e6c14fe141ff7b80192d0528262 0x0000000000000000000000000000000000000000000000000000000000000000 0x000000000000000000000000000000000000000000546f20546865204d6f6f6e 0x000000000000000000000000000000000000000000000000000000000000000b 0x0000000000000000000000000000000000000000000000000000000000000000 0x000000000000000000000000000000000000000000000000000000000054544d 0x0000000000000000000000000000000000000000000000000000000000000003 0x00000000000000000000000000000000000000000000000000000000000f4240 0x0000000000000000000000000000000000000000000000000000000000000000]
  */
  stonkIdHex := event.Event.Keys[1]
  stonkAddress := event.Event.Data[0][2:] // remove 0x prefix
  // stonkNameLengthHex := event.Event.Data[1] // TODO: Use this
  stonkShortNameHex := event.Event.Data[2][2:] // remove 0x prefix
  stonkShortNameLengthHex := event.Event.Data[3]
  // stonkSymbolLengthHex := event.Event.Data[4] // TODO: Use this
  stonkShortSymbolHex := event.Event.Data[5][2:] // remove 0x prefix
  stonkShortSymbolLengthHex := event.Event.Data[6]
  stonkDenominationLowHex := event.Event.Data[7]
  // stonkDenominationHighHex := event.Event.Data[8] // TODO: Use this

  stonkId, err := strconv.ParseUint(stonkIdHex, 0, 64)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error parsing stonk id", err, event.Event.Data)
    return
  }

  stonkShortName, err := hex.DecodeString(stonkShortNameHex)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error decoding stonk short name", err, event.Event.Data)
    return
  }

  stonkShortNameLength, err := strconv.ParseUint(stonkShortNameLengthHex, 0, 64)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error parsing stonk short name length", err, event.Event.Data)
    return
  }
  stonkShortName = stonkShortName[len(stonkShortName)-int(stonkShortNameLength):]

  stonkShortSymbol, err := hex.DecodeString(stonkShortSymbolHex)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error decoding stonk short symbol", err, event.Event.Data)
    return
  }

  stonkShortSymbolLength, err := strconv.ParseUint(stonkShortSymbolLengthHex, 0, 64)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error parsing stonk short symbol length", err, event.Event.Data)
    return
  }
  stonkShortSymbol = stonkShortSymbol[len(stonkShortSymbol)-int(stonkShortSymbolLength):]

  stonkDenominationLow, err := strconv.ParseUint(stonkDenominationLowHex, 0, 64)
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error parsing stonk denomination low", err, event.Event.Data)
    return
  }

  /*
    CREATE TABLE Stonks (
    id integer NOT NULL PRIMARY KEY,
    address char(64) NOT NULL,
    name TEXT NOT NULL,
    SYMBOL TEXT NOT NULL,
    denom int NOT NULL
  );
  */
  _, err = core.StonksBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO Stonks (id, address, name, symbol, denom) VALUES ($1, $2, $3, $4, $5)", stonkId, stonkAddress, string(stonkShortName), string(stonkShortSymbol), stonkDenominationLow);
  if err != nil {
    PrintIndexerError("processNewStonkEvent", "error inserting stonk in postgres", err)
    return
  }
}

func revertNewStonkEvent(event IndexerEvent) {
  stonkIdHex := event.Event.Keys[1]
  stonkId, err := strconv.ParseUint(stonkIdHex, 0, 64)
  if err != nil {
    PrintIndexerError("revertNewStonkEvent", "error parsing stonk id", err, event.Event.Data)
    return
  }

  _, err = core.StonksBackend.Databases.Postgres.Exec(context.Background(), "DELETE FROM Stonks WHERE id = $1", stonkId)
  if err != nil {
    PrintIndexerError("revertNewStonkEvent", "error deleting stonk in postgres", err)
    return
  }
}

func processStonkClaimedEvent(event IndexerEvent) {
  /*
    #[key]
    pub stonk: u64,
    #[key]
    pub claimer: ContractAddress,
    pub amount: u256
  */
  stonkIdHex := event.Event.Keys[1]
  claimerAddress := event.Event.Keys[2][2:] // remove 0x prefix
  amountHex := event.Event.Data[0]

  stonkId, err := strconv.ParseUint(stonkIdHex, 0, 64)
  if err != nil {
    PrintIndexerError("processStonkClaimedEvent", "error parsing stonk id", err, event.Event.Data)
    return
  }

  amount, err := strconv.ParseUint(amountHex, 0, 64)
  if err != nil {
    PrintIndexerError("processStonkClaimedEvent", "error parsing amount", err, event.Event.Data)
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
  _, err = core.StonksBackend.Databases.Postgres.Exec(context.Background(), "INSERT INTO UserStonks (user_address, stonk_id, balance) VALUES ($1, $2, $3) ON CONFLICT (user_address, stonk_id) DO UPDATE SET balance = UserStonks.balance + $3", claimerAddress, stonkId, amount)
  if err != nil {
    PrintIndexerError("processStonkClaimedEvent", "error inserting user stonk in postgres", err)
    return
  }
}

func revertStonkClaimedEvent(event IndexerEvent) {
  stonkIdHex := event.Event.Keys[1]
  claimerAddress := event.Event.Keys[2][2:] // remove 0x prefix
  amountHex := event.Event.Data[0]

  stonkId, err := strconv.ParseUint(stonkIdHex, 0, 64)
  if err != nil {
    PrintIndexerError("revertStonkClaimedEvent", "error parsing stonk id", err, event.Event.Data)
    return
  }

  amount, err := strconv.ParseUint(amountHex, 0, 64)
  if err != nil {
    PrintIndexerError("revertStonkClaimedEvent", "error parsing amount", err, event.Event.Data)
    return
  }

  _, err = core.StonksBackend.Databases.Postgres.Exec(context.Background(), "UPDATE UserStonks SET balance = UserStonks.balance - $3 WHERE user_address = $1 AND stonk_id = $2", claimerAddress, stonkId, amount)
  if err != nil {
    PrintIndexerError("revertStonkClaimedEvent", "error updating user stonk in postgres", err)
    return
  }
}

var eventProcessors = map[string](func(IndexerEvent)){
    newStonkEvent: processNewStonkEvent,
    stonkClaimedEvent: processStonkClaimedEvent,
}

var eventReverters = map[string](func(IndexerEvent)){
    newStonkEvent: revertNewStonkEvent,
    stonkClaimedEvent: revertStonkClaimedEvent,
}

var eventRequiresOrdering = map[string]bool{
    newStonkEvent: true,
    stonkClaimedEvent: true,
}

const (
	DATA_STATUS_FINALIZED = "DATA_STATUS_FINALIZED"
	DATA_STATUS_ACCEPTED  = "DATA_STATUS_ACCEPTED"
	DATA_STATUS_PENDING   = "DATA_STATUS_PENDING"
)

func PrintIndexerError(funcName string, errMsg string, args ...interface{}) {
	fmt.Println("Error indexing in "+funcName+": "+errMsg+" -- ", args)
}

func consumeIndexerMsg(w http.ResponseWriter, r *http.Request) {
	message, err := routeutils.ReadJsonBody[IndexerMessage](r)
	if err != nil {
		PrintIndexerError("consumeIndexerMsg", "error reading indexer message", err)
		return
	}

	if len(message.Data.Batch) == 0 {
		fmt.Println("No events in batch")
		return
	}

	if message.Data.Finality == DATA_STATUS_FINALIZED {
		// TODO: Track diffs with accepted messages? / check if accepted message processed
		FinalizedMessageLock.Lock()
		FinalizedMessageQueue = append(FinalizedMessageQueue, *message)
		FinalizedMessageLock.Unlock()
		return
	} else if message.Data.Finality == DATA_STATUS_ACCEPTED {
		AcceptedMessageLock.Lock()
		// TODO: Ensure ordering w/ EndCursor?
		AcceptedMessageQueue = append(AcceptedMessageQueue, *message)
		AcceptedMessageLock.Unlock()
		return
	} else if message.Data.Finality == DATA_STATUS_PENDING {
		PendingMessageLock.Lock()
		LatestPendingMessage = message
		PendingMessageLock.Unlock()
		return
	} else {
		fmt.Println("Unknown finality status")
	}
}

func ProcessMessageEvents(message IndexerMessage) {
	for _, event := range message.Data.Batch[0].Events {
		eventKey := event.Event.Keys[0]
		eventProcessor, ok := eventProcessors[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error processing event", eventKey)
			return
		}
		eventProcessor(event)
	}
}

// TODO: Improve this with hashing?
func EventComparator(event1 IndexerEvent, event2 IndexerEvent) bool {
	if event1.Event.FromAddress != event2.Event.FromAddress {
		return false
	}

	if len(event1.Event.Keys) != len(event2.Event.Keys) {
		return false
	}

	if len(event1.Event.Data) != len(event2.Event.Data) {
		return false
	}

	for idx := 0; idx < len(event1.Event.Keys); idx++ {
		if event1.Event.Keys[idx] != event2.Event.Keys[idx] {
			return false
		}
	}

	for idx := 0; idx < len(event1.Event.Data); idx++ {
		if event1.Event.Data[idx] != event2.Event.Data[idx] {
			return false
		}
	}

	return true
}

func processMessageEventsWithReverter(oldMessage IndexerMessage, newMessage IndexerMessage) {
	var idx int
	var latestEventIndex int
	var unorderedEvents []IndexerEvent
	for idx = 0; idx < len(oldMessage.Data.Batch[0].Events); idx++ {
		oldEvent := oldMessage.Data.Batch[0].Events[idx]
		newEvent := newMessage.Data.Batch[0].Events[idx]
		// Check if events are the same
		if EventComparator(oldEvent, newEvent) {
			latestEventIndex = idx
			continue
		}

		// Non-matching events, revert remaining old events based on ordering
		// TODO: Print note here and see how often this happens
		// Revert events from end of old events to current event
		latestEventIndex = idx
		for idx = len(oldMessage.Data.Batch[0].Events) - 1; idx >= latestEventIndex; idx-- {
			eventKey := oldMessage.Data.Batch[0].Events[idx].Event.Keys[0]
			if eventRequiresOrdering[eventKey] {
				// Revert event
				eventReverter, ok := eventReverters[eventKey]
				if !ok {
					PrintIndexerError("consumeIndexerMsg", "error reverting event", eventKey)
					return
				}
				eventReverter(oldMessage.Data.Batch[0].Events[idx])
			} else {
				unorderedEvents = append(unorderedEvents, oldMessage.Data.Batch[0].Events[idx])
			}
		}
		break
	}

	// Process new events
	for idx = latestEventIndex + 1; idx < len(newMessage.Data.Batch[0].Events); idx++ {
		eventKey := newMessage.Data.Batch[0].Events[idx].Event.Keys[0]

		// Check if event is in unordered events
		var wasProcessed bool
		for idx, unorderedEvent := range unorderedEvents {
			if EventComparator(unorderedEvent, newMessage.Data.Batch[0].Events[idx]) {
				// Remove event from unordered events
				unorderedEvents = append(unorderedEvents[:idx], unorderedEvents[idx+1:]...)
				wasProcessed = true
				break
			}
		}
		if wasProcessed {
			continue
		}

		eventProcessor, ok := eventProcessors[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error processing event", eventKey)
			return
		}
		eventProcessor(newMessage.Data.Batch[0].Events[idx])
	}

	// Revert remaining unordered events
	for _, unorderedEvent := range unorderedEvents {
		eventKey := unorderedEvent.Event.Keys[0]
		eventReverter, ok := eventReverters[eventKey]
		if !ok {
			PrintIndexerError("consumeIndexerMsg", "error reverting event", eventKey)
			return
		}
		eventReverter(unorderedEvent)
	}
}

func ProcessMessage(message IndexerMessage) {
	// Check if there are pending messages for this start key
	// TODO: OrderKey or UniqueKey or both?
	if LastProcessedPendingMessage != nil && LastProcessedPendingMessage.Data.Cursor.OrderKey == message.Data.Cursor.OrderKey {
		processMessageEventsWithReverter(*LastProcessedPendingMessage, message)
	} else {
		ProcessMessageEvents(message)
	}
}

func TryProcessFinalizedMessages() bool {
	FinalizedMessageLock.Lock()
	defer FinalizedMessageLock.Unlock()

	if len(FinalizedMessageQueue) > 0 {
		message := FinalizedMessageQueue[0]
		FinalizedMessageQueue = FinalizedMessageQueue[1:]
		if message.Data.Cursor.OrderKey <= LastFinalizedCursor {
			// Skip message
			return true
		}
		ProcessMessage(message)
		LastFinalizedCursor = message.Data.Cursor.OrderKey
		return true
	}
	return false
}

func TryProcessAcceptedMessages() bool {
	AcceptedMessageLock.Lock()
	defer AcceptedMessageLock.Unlock()

	if len(AcceptedMessageQueue) > 0 {
		message := AcceptedMessageQueue[0]
		AcceptedMessageQueue = AcceptedMessageQueue[1:]
		// TODO: Check if message is already processed?
		ProcessMessage(message)
		// TODO
		LastFinalizedCursor = message.Data.Cursor.OrderKey
		return true
	}
	return false
}

func TryProcessPendingMessage() bool {
	PendingMessageLock.Lock()
	defer PendingMessageLock.Unlock()

	if LatestPendingMessage == nil {
		return false
	}

	ProcessMessage(*LatestPendingMessage)
	LastProcessedPendingMessage = LatestPendingMessage
	LatestPendingMessage = nil
	return true
}

func StartMessageProcessor() {
	// Goroutine to process pending/accepted messages
	go func() {
		for {
			// Check Finalized messages ( for initial load )
			if TryProcessFinalizedMessages() {
				continue
			}

			// Prioritize accepted messages
			if TryProcessAcceptedMessages() {
				continue
			}

			if TryProcessPendingMessage() {
				continue
			}

			// No messages to process, sleep for 1 second
			time.Sleep(1 * time.Second)
		}
	}()
}

// TODO: User might miss some messages between loading canvas and connecting to websocket?
// TODO: Check thread safety of these things
