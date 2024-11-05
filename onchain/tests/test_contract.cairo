use starknet::{ContractAddress, contract_address_const};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

use onchain::stonks::IStonksSafeDispatcher;
use onchain::stonks::IStonksSafeDispatcherTrait;
use onchain::stonks::IStonksDispatcher;
use onchain::stonks::IStonksDispatcherTrait;
use onchain::stonk::StonkToken;
use onchain::stonks::Stonks::InitParams;

fn deploy_contract() -> ContractAddress {
    let stonk_token = declare("StonkToken").unwrap().contract_class();

    let contract = declare("Stonks").unwrap().contract_class();
    let calldata = InitParams {
        stonk_token_hash: *stonk_token.class_hash,
        init_tokens: array![
            StonkToken::InitParams {
                name: "Test",
                symbol: "TST",
                denomination: 10000
            }
        ],
        devmode: true,
    };
    let mut calldata_ser = array![];
    calldata.serialize(ref calldata_ser);
    let (contract_address, _) = contract.deploy(@calldata_ser).unwrap();
    contract_address
}

#[test]
fn test_contract_deploys() {
    let contract_address = deploy_contract();
    let zero_address = contract_address_const::<0>();
    assert(contract_address != zero_address, 'Invalid contract address');
}
