use core::starknet::{ContractAddress, ClassHash};
use crate::stonk::StonkToken;

#[starknet::interface]
pub trait IStonks<TContractState> {
    fn get_stonks(self: @TContractState) -> Span<ContractAddress>;
    fn add_stonk(ref self: TContractState, class_hash: ClassHash, stonk: StonkToken::InitParams);
    fn add_deployed_stonk(ref self: TContractState, stonk: ContractAddress);
    // TODO: fn remove_stonk(ref self, stonk: ContractAddress);

    fn get_devmode(self: @TContractState) -> bool;

    fn claim(ref self: TContractState, stonk_id: u64);
}

#[starknet::contract]
pub mod Stonks {
    use starknet::storage::{Vec, VecTrait, MutableVecTrait, StoragePathEntry};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::ClassHash;
    use core::starknet::{get_caller_address, ContractAddress};
    use starknet::syscalls::deploy_syscall;
    use crate::stonk::StonkToken;
    use crate::stonk::{IStonkTokenDispatcher, IStonkTokenDispatcherTrait};

    #[storage]
    struct Storage {
        // List of all stonks/token contracts.
        stonks: Vec<ContractAddress>,
        // Is the contract in devnet mode.
        devmode: bool,
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub stonk_token_hash: ClassHash,
        pub init_tokens: Array<StonkToken::InitParams>,
        pub devmode: bool,
    }

    #[derive(Drop, Serde, starknet::Event)]
    pub struct NewStonk {
        #[key]
        pub id: u64,
        pub address: ContractAddress,
        pub metadata: StonkToken::InitParams,
    }

    #[derive(Drop, Serde, starknet::Event)]
    pub struct StonkClaimed {
        #[key]
        pub stonk: u64,
        #[key]
        pub claimer: ContractAddress,
        pub amount: u256
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        NewStonk: NewStonk,
        StonkClaimed: StonkClaimed,
    }

    #[constructor]
    fn constructor(ref self: ContractState, init_params: InitParams) {
        for stonk in init_params.init_tokens {
            let mut stonk_ser = array![];
            stonk.serialize(ref stonk_ser);
            let deploy_res = deploy_syscall(init_params.stonk_token_hash, 42, stonk_ser.span(), true);
            if deploy_res.is_err() {
                panic!("Failed to deploy stonk token contract");
            }
            let (addr, _response) = deploy_res.unwrap();
            let stonk_id = self.stonks.len();
            self.stonks.append().write(addr);
            self.emit(NewStonk {
                id: stonk_id,
                address: addr,
                metadata: stonk,
            });
        };
        self.devmode.write(init_params.devmode);
    }

    #[abi(embed_v0)]
    impl StonksImpl of super::IStonks<ContractState> {
        fn get_stonks(self: @ContractState) -> Span<ContractAddress> {
            let mut stonks: Array<ContractAddress> = array![];
            let mut i = 0;
            let stonks_len = self.stonks.len();
            while i < stonks_len {
                stonks.append(self.stonks.at(i).read());
                i += 1;
            };
            stonks.span()
        }

        fn add_stonk(ref self: ContractState, class_hash: ClassHash, stonk: StonkToken::InitParams) {
            let mut stonk_ser = array![];
            stonk.serialize(ref stonk_ser);
            let deploy_res = deploy_syscall(class_hash, 42, stonk_ser.span(), true);
            if deploy_res.is_err() {
                panic!("Failed to deploy stonk token contract");
            }
            let (addr, _response) = deploy_res.unwrap();
            let stonk_id = self.stonks.len();
            self.stonks.append().write(addr);
            self.emit(NewStonk {
                id: stonk_id,
                address: addr,
                metadata: stonk,
            });
        }

        fn add_deployed_stonk(ref self: ContractState, stonk: ContractAddress) {
            self.stonks.append().write(stonk);
            // TODO: emit event w/ metadata from dispatcher
        }

        fn get_devmode(self: @ContractState) -> bool {
            self.devmode.read()
        }

        fn claim(ref self: ContractState, stonk_id: u64) {
            let stonk_addr = self.stonks.at(stonk_id).read();
            let dispatcher = IStonkTokenDispatcher{ contract_address: stonk_addr };
            let caller = get_caller_address();
            let amt = dispatcher.claim(caller);
            self.emit(StonkClaimed {
                stonk: stonk_id,
                claimer: caller,
                amount: amt,
            });
        }
    }
}
