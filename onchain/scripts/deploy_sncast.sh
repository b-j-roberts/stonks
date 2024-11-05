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
echo "/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE account add --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY --url $RPC_URL --type oz"
/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE account import --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY --url $RPC_URL --type oz

CONTRACT_DIR=$WORK_DIR/onchain
echo $(cd $CONTRACT_DIR && ls)
STONKS_CLASS_NAME="Stonks"

#TODO: Issue if no declare done
echo "Declaring class \"$STONKS_CLASS_NAME\"..."
echo $(ls)
while true; do
    sleep 5
done
echo "/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --url $RPC_URL --contract-name $STONKS_CLASS_NAME --fee-token eth"
STONKS_CLASS_DECLARE_RESULT=$(cd $CONTRACT_DIR && /root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json declare --url $RPC_URL --contract-name $STONKS_CLASS_NAME --fee-token eth | tail -n 1)
STONKS_CLASS_HASH=$(echo $STONKS_CLASS_DECLARE_RESULT | jq -r '.class_hash')
echo "Declared class \"$STONKS_CLASS_NAME\" with hash $STONKS_CLASS_HASH"

DEVNET_MODE=1

CALLDATA=$(echo -n $DEVNET_MODE)

# Precalculated contract address
# echo "Precalculating contract address..."

# TODO: calldata passed as parameters
echo "Deploying contract \"$STONKS_CLASS_NAME\"..."
echo "/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --url $RPC_URL --class-hash $STONKS_CLASS_HASH --constructor-calldata $CALLDATA"
STONKS_CONTRACT_DEPLOY_RESULT=$(/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json deploy --url $RPC_URL --class-hash $STONKS_CLASS_HASH --constructor-calldata $CALLDATA | tail -n 1)
STONKS_CONTRACT_ADDRESS=$(echo $STONKS_CONTRACT_DEPLOY_RESULT | jq -r '.contract_address')
echo "Deployed contract \"$STONKS_CLASS_NAME\" with address $STONKS_CONTRACT_ADDRESS"

# TODO: Remove these lines?
echo "STONKS_CONTRACT_ADDRESS=$STONKS_CONTRACT_ADDRESS" > /configs/configs.env
echo "REACT_APP_STONKS_CONTRACT_ADDRESS=$STONKS_CONTRACT_ADDRESS" >> /configs/configs.env
