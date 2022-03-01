import * as beprojs from 'bepro-js';

import { ContractProvider } from '@providers/ContractProvider';
import { createNodeRedisClient } from 'handy-redis';

export class BeproContractProvider implements ContractProvider {
  public bepro: any;

  public web3Providers: Array<string>;

  constructor() {
    // providers are comma separated
    this.web3Providers = process.env.WEB3_PROVIDER.split(',');
  }

  public initializeBepro(web3ProviderIndex: number) {
    // picking up provider and starting bepro
    this.bepro = new beprojs.Application({
      web3Provider: this.web3Providers[web3ProviderIndex]
    });
    this.bepro.start();
  }

  public getContract(contract: string, address: string, providerIndex: number) {
    this.initializeBepro(providerIndex);

    if (contract === 'predictionMarket') {
      return this.bepro.getPredictionMarketContract({ contractAddress: address });
    } else if (contract === 'erc20') {
      return this.bepro.getERC20Contract({ contractAddress: address });
    } else if (contract === 'realitio') {
      return this.bepro.getRealitioERC20Contract({ contractAddress: address });
    } else if (contract === 'achievements') {
      return this.bepro.getAchievementsContract({ contractAddress: address });
    } else {
      // this should never happen - should be overruled by the controller
      throw `'Contract ${contract} is not defined`;
    }
  }

  public async getContractEvents(contract: string, address: string, providerIndex: number, eventName: string, filter: Object) {
    const beproContract = this.getContract(contract, address, providerIndex);
    const blockConfig = process.env.WEB3_PROVIDER_BLOCK_CONFIG ? JSON.parse(process.env.WEB3_PROVIDER_BLOCK_CONFIG) : null;

    if (!blockConfig) {
      // no block config, querying directly in evm
      const events = await beproContract.getEvents(eventName, filter);
      return events;
    }

    const readClient = createNodeRedisClient({ url: process.env.REDIS_URL, retry_strategy: () => { return undefined; } });
    readClient.nodeRedis.on("error", err => {
      // redis connection error, ignoring and letting the get/set functions error handlers act
      console.log("ERR :: Redis Connection: " + err);
      readClient.end();
    });

    // iterating by block numbers
    let events = [];
    let fromBlock = blockConfig.fromBlock;
    const blockRanges = []
    const currentBlockNumber = await beproContract.web3.eth.getBlockNumber();

    while (fromBlock < currentBlockNumber) {
      const toBlock = (fromBlock + blockConfig.blockCount) > currentBlockNumber
        ? currentBlockNumber
        : (fromBlock + blockConfig.blockCount);

      blockRanges.push({
        fromBlock,
        toBlock
      });

      fromBlock = toBlock;
    }

    const keys = blockRanges.map((blockRange) => {
      const blockRangeStr = `${blockRange.fromBlock}-${blockRange.toBlock}`;
      return `events:${contract}:${address}:${eventName}:${JSON.stringify(filter)}:${blockRangeStr}`;
    });

    const response = await readClient.mget(...keys).catch(err => {
      console.log(err);
      readClient.end();
      throw(err);
    });

    // closing connection after request is finished
    readClient.end();

    await Promise.all(blockRanges.map(async (blockRange, index) => {
      // checking redis if events are cached
      const result = response[index];
      let blockEvents;

      if (result) {
        blockEvents = JSON.parse(result);
      } else {
        blockEvents = await beproContract.getContract().getPastEvents(eventName, {
          filter,
          ...blockRange
        });

        // not writing to cache if block range is not complete
        if (blockRange.toBlock - blockRange.fromBlock === blockConfig.blockCount) {
          const writeClient = createNodeRedisClient({ url: process.env.REDIS_URL, retry_strategy: () => { return undefined; } });
          writeClient.nodeRedis.on("error", err => {
            // redis connection error, ignoring and letting the get/set functions error handlers act
            console.log("ERR :: Redis Connection: " + err);
            writeClient.end();
          });

          const blockRangeStr = `${blockRange.fromBlock}-${blockRange.toBlock}`;
          const key = `events:${contract}:${address}:${eventName}:${JSON.stringify(filter)}:${blockRangeStr}`;
          await writeClient.set(key, JSON.stringify(blockEvents)).catch(err => {
            console.log(err);
            writeClient.end();
            throw(err);
          });
          writeClient.end();
        }
      }
      events = blockEvents.concat(events);
    }));

    return events.sort((a, b) => a.blockNumber - b.blockNumber);
  }
}
