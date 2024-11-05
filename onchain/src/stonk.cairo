use starknet::ContractAddress;

#[starknet::interface]
pub trait IStonkToken<TContractState> {
    fn claim(
        ref self: TContractState,
        recipient: ContractAddress
    ) -> u256;
}

#[starknet::contract]
pub mod StonkToken {
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    pub struct Storage {
        denomination: u256,
        #[substorage(v0)]
        pub erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[derive(Drop, Serde)]
    pub struct InitParams {
        pub name: ByteArray,
        pub symbol: ByteArray,
        pub denomination: u256
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        init_params: InitParams
    ) {
        self.erc20.initializer(init_params.name, init_params.symbol);
        self.denomination.write(init_params.denomination);
    }

    #[abi(embed_v0)]
    impl StonkTokenImpl of super::IStonkToken<ContractState> {
        fn claim(
            ref self: ContractState,
            recipient: ContractAddress
        ) -> u256 {
            // Using write instead of mint so we don't update total_supply ( helps parallelism )
            let balance = self.erc20.balanceOf(recipient);
            self.erc20.ERC20_balances.write(recipient, balance + self.denomination.read());
            return self.denomination.read();
        }
    }
}
