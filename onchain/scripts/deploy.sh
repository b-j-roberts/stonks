#!/bin/bash
#
# This script deploys the STONKs contract to the StarkNet devnet in docker

RPC_HOST="devnet"
RPC_PORT=5050

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/../..

#TODO: 2 seperate directories when called from the test script
OUTPUT_DIR=$HOME/.stonks-tests
TIMESTAMP=$(date +%s)
LOG_DIR=$OUTPUT_DIR/logs/$TIMESTAMP
TMP_DIR=$OUTPUT_DIR/tmp/$TIMESTAMP

# TODO: Clean option to remove old logs and state
#rm -rf $OUTPUT_DIR/logs/*
#rm -rf $OUTPUT_DIR/tmp/*
mkdir -p $LOG_DIR
mkdir -p $TMP_DIR

ACCOUNT_NAME=stonks_acct
ACCOUNT_ADDRESS=0x328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0
ACCOUNT_PRIVATE_KEY=0x856c96eaa4e7c40c715ccc5dacd8bf6e
ACCOUNT_PROFILE=starknet-devnet
ACCOUNT_FILE=$TMP_DIR/starknet_accounts.json

echo "Creating account \"$ACCOUNT_NAME\"..."
echo "$HOME/.starkli/bin/starkli account fetch $ACCOUNT_ADDRESS --rpc $RPC_URL --network devnet --force --output $ACCOUNT_FILE"
$HOME/.starkli/bin/starkli account fetch $ACCOUNT_ADDRESS --rpc $RPC_URL --network devnet --force --output $ACCOUNT_FILE

CONTRACT_DIR=$WORK_DIR/onchain
#TODO: Error finding file Scarb.toml?
cd $CONTRACT_DIR && $HOME/.local/bin/scarb build

STONK_TOKEN_CLASS_NAME="StonkToken"

echo "Declaring class \"$STONK_TOKEN_CLASS_NAME\"..."
STONK_TOKEN_SIERRA_FILE=$CONTRACT_DIR/target/dev/onchain_StonkToken.contract_class.json
echo "$HOME/.starkli/bin/starkli declare --private-key $ACCOUNT_PRIVATE_KEY --network devnet --watch $STONK_TOKEN_SIERRA_FILE --rpc $RPC_URL --account $ACCOUNT_FILE --compiler-version 2.8.2"
STONK_TOKEN_DECLARE_RESULT=$($HOME/.starkli/bin/starkli declare --private-key $ACCOUNT_PRIVATE_KEY --network devnet --watch $STONK_TOKEN_SIERRA_FILE --rpc $RPC_URL --account $ACCOUNT_FILE --compiler-version 2.8.2)
STONK_TOKEN_CLASS_HASH=$(echo $STONK_TOKEN_DECLARE_RESULT | tail -n 1)
echo "Declared class \"$STONK_TOKEN_CLASS_NAME\" with hash $STONK_TOKEN_CLASS_HASH"

STONKS_CLASS_NAME="Stonks"

#TODO: Issue if no declare done
echo "Declaring class \"$STONKS_CLASS_NAME\"..."
STONKS_SIERRA_FILE=$CONTRACT_DIR/target/dev/onchain_Stonks.contract_class.json
echo "$HOME/.starkli/bin/starkli declare --private-key $ACCOUNT_PRIVATE_KEY --network devnet --watch $STONKS_SIERRA_FILE --rpc $RPC_URL --account $ACCOUNT_FILE --compiler-version 2.8.2"
STONKS_DECLARE_RESULT=$($HOME/.starkli/bin/starkli declare --private-key $ACCOUNT_PRIVATE_KEY --network devnet --watch $STONKS_SIERRA_FILE --rpc $RPC_URL --account $ACCOUNT_FILE --compiler-version 2.8.2)
STONKS_CLASS_HASH=$(echo $STONKS_DECLARE_RESULT | tail -n 1)
echo "Declared class \"$STONKS_CLASS_NAME\" with hash $STONKS_CLASS_HASH"

INIT_STONK_COUNT=1
INIT_STONK_NAME="To The Moon"
INIT_STONK_SYMBOL="TTM"
INIT_STONK_DENOM="1000000 0"

#TODO: Fix text_to_byte_array.sh for starkli
INIT_STONK_NAME_CALLDATA_RAW=$($SCRIPT_DIR/text_to_byte_array.sh "$INIT_STONK_NAME")
INIT_STONK_NAME_CALLDATA=$(echo $INIT_STONK_NAME_CALLDATA_RAW | sed 's/\[//g' | sed 's/\]//g' | sed 's/,/\ /g')

INIT_STONK_SYMBOL_CALLDATA_RAW=$($SCRIPT_DIR/text_to_byte_array.sh "$INIT_STONK_SYMBOL")
INIT_STONK_SYMBOL_CALLDATA=$(echo $INIT_STONK_SYMBOL_CALLDATA_RAW | sed 's/\[//g' | sed 's/\]//g' | sed 's/,/\ /g')

DEVNET_MODE=1

CALLDATA=$(echo -n $STONK_TOKEN_CLASS_HASH $INIT_STONK_COUNT 0 $INIT_STONK_NAME_CALLDATA 0 $INIT_STONK_SYMBOL_CALLDATA $INIT_STONK_DENOM $DEVNET_MODE)

# TODO: calldata passed as parameters
echo "Deploying contract \"$STONKS_CLASS_NAME\"..."
echo "$HOME/.starkli/bin/starkli deploy --private-key $ACCOUNT_PRIVATE_KEY --network devnet --rpc $RPC_URL --account $ACCOUNT_FILE $STONKS_CLASS_HASH $CALLDATA"
STONKS_DEPLOY_RESULT=$($HOME/.starkli/bin/starkli deploy --private-key $ACCOUNT_PRIVATE_KEY --network devnet --rpc $RPC_URL --account $ACCOUNT_FILE $STONKS_CLASS_HASH $CALLDATA)
STONKS_CONTRACT_ADDRESS=$(echo $STONKS_DEPLOY_RESULT)
echo "Deployed contract \"$STONKS_CLASS_NAME\" with address $STONKS_CONTRACT_ADDRESS"

# TODO: Remove these lines?
echo "STONKS_CONTRACT_ADDRESS=$STONKS_CONTRACT_ADDRESS" > /configs/configs.env
echo "REACT_APP_STONKS_CONTRACT_ADDRESS=$STONKS_CONTRACT_ADDRESS" >> /configs/configs.env
