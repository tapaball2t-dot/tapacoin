import { Clarinet, Tx, Chain, Account, types } from '@hirosystems/clarinet-sdk';
import { expect } from 'vitest';

const contracts = {
  tapacoin: 'tapacoin'
};

Clarinet.test({
  name: 'Ensure contract initialization works correctly',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Test initial state
    let block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-name', [], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-symbol', [], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-decimals', [], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-total-supply', [], deployer.address)
    ]);
    
    expect(block.receipts.length).toBe(4);
    expect(block.receipts[0].result).toStrictEqual('(ok "Tapacoin")');
    expect(block.receipts[1].result).toStrictEqual('(ok "TAPA")');
    expect(block.receipts[2].result).toStrictEqual('(ok u6)');
    expect(block.receipts[3].result).toStrictEqual('(ok u0)');
    
    // Test initialization with initial supply
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    expect(block.receipts.length).toBe(1);
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify total supply and balance
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-total-supply', [], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet1.address)], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok u1000000000)');
    expect(block.receipts[1].result).toStrictEqual('(ok u1000000000)');
  },
});

Clarinet.test({
  name: 'Ensure double initialization fails',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // First initialization
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Second initialization should fail
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(500000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(err u104)');
  },
});

Clarinet.test({
  name: 'Ensure transfers work correctly',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Initialize with supply
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    // Transfer tokens
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'transfer',
        [
          types.uint(100000),
          types.principal(wallet1.address),
          types.principal(wallet2.address),
          types.none()
        ],
        wallet1.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify balances
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet1.address)], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet2.address)], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok u900000)');
    expect(block.receipts[1].result).toStrictEqual('(ok u100000)');
  },
});

Clarinet.test({
  name: 'Ensure unauthorized transfers fail',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    const wallet3 = accounts.get('wallet_3')!;
    
    // Initialize with supply
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    // Try unauthorized transfer (wallet3 trying to transfer wallet1's tokens)
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'transfer',
        [
          types.uint(100000),
          types.principal(wallet1.address),
          types.principal(wallet2.address),
          types.none()
        ],
        wallet3.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(err u101)');
  },
});

Clarinet.test({
  name: 'Ensure minting works correctly for owner',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Mint tokens
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'mint',
        [types.uint(500000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify balance and total supply
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet1.address)], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-total-supply', [], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok u500000)');
    expect(block.receipts[1].result).toStrictEqual('(ok u500000)');
  },
});

Clarinet.test({
  name: 'Ensure unauthorized minting fails',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Try minting as non-owner
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'mint',
        [types.uint(500000), types.principal(wallet2.address)],
        wallet1.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(err u100)');
  },
});

Clarinet.test({
  name: 'Ensure burning works correctly',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Initialize and mint tokens
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    // Burn tokens
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'burn',
        [types.uint(200000), types.principal(wallet1.address)],
        wallet1.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify balance and total supply
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet1.address)], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-total-supply', [], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok u800000)');
    expect(block.receipts[1].result).toStrictEqual('(ok u800000)');
  },
});

Clarinet.test({
  name: 'Ensure contract approval system works',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Approve wallet2 as a contract
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'set-contract-approved',
        [types.principal(wallet2.address), types.bool(true)],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Check approval status
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'is-contract-approved',
        [types.principal(wallet2.address)],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('true');
    
    // Now wallet2 should be able to mint
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'mint',
        [types.uint(500000), types.principal(wallet1.address)],
        wallet2.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
  },
});

Clarinet.test({
  name: 'Ensure token URI functions work',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // Initially should be none
    let block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-token-uri', [], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok none)');
    
    // Set token URI
    const tokenUri = 'https://example.com/tapacoin-metadata.json';
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'set-token-uri',
        [types.some(types.utf8(tokenUri))],
        deployer.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify URI was set
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-token-uri', [], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual(`(ok (some u"${tokenUri}"))`);
  },
});

Clarinet.test({
  name: 'Ensure batch transfers work',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    const wallet3 = accounts.get('wallet_3')!;
    
    // Initialize with supply
    let block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'initialize',
        [types.uint(1000000), types.principal(wallet1.address)],
        deployer.address
      )
    ]);
    
    // Batch transfer
    block = chain.mineBlock([
      Tx.contractCall(
        contracts.tapacoin,
        'transfer-many',
        [
          types.list([
            types.tuple({
              amount: types.uint(100000),
              from: types.principal(wallet1.address),
              to: types.principal(wallet2.address),
              memo: types.none()
            }),
            types.tuple({
              amount: types.uint(200000),
              from: types.principal(wallet1.address),
              to: types.principal(wallet3.address),
              memo: types.none()
            })
          ])
        ],
        wallet1.address
      )
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok true)');
    
    // Verify balances
    block = chain.mineBlock([
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet1.address)], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet2.address)], deployer.address),
      Tx.contractCall(contracts.tapacoin, 'get-balance', [types.principal(wallet3.address)], deployer.address)
    ]);
    
    expect(block.receipts[0].result).toStrictEqual('(ok u700000)');
    expect(block.receipts[1].result).toStrictEqual('(ok u100000)');
    expect(block.receipts[2].result).toStrictEqual('(ok u200000)');
  },
});


import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("example tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
