#!/bin/bash

# TODO: Host?
RPC_HOST="devnet"
RPC_PORT=5050
echo "Running claim_stonk.sh"

RPC_URL=http://$RPC_HOST:$RPC_PORT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
WORK_DIR=$SCRIPT_DIR/..

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

echo "/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE account import --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY --url $RPC_URL --type oz" > $LOG_DIR/cmd.txt
/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE account import --name $ACCOUNT_NAME --address $ACCOUNT_ADDRESS --private-key $ACCOUNT_PRIVATE_KEY  --url $RPC_URL --type oz

#TODO: rename script and make more generic
echo "/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME invoke --contract-address $1 --function $2 --calldata $3 --url $RPC_URL --fee-token strk" >> $LOG_DIR/cmd.txt
/root/.local/bin/sncast --accounts-file $ACCOUNT_FILE --account $ACCOUNT_NAME --wait --json invoke --contract-address $1 --function $2 --calldata $3 --url $RPC_URL --fee-token strk > $LOG_DIR/output.json
