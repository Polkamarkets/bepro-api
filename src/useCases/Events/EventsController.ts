import { Request, Response } from 'express';
import { EventsDTO } from './EventsDTO';

import { EventsUseCase } from './EventsUseCase';

export class EventsController {
  constructor(private eventsUseCase: EventsUseCase) {}

  async handle(request: Request, response: Response): Promise<Response> {
    const { contract, eventName, filter, address } = request.query;

    for(let providerIndex = 0; providerIndex < this.eventsUseCase.contractProvider.web3Providers.length; providerIndex++) {
      try {
        const data = await this.eventsUseCase.execute({
          contract,
          eventName,
          address,
          providerIndex,
          filter: filter ? JSON.parse(filter as string) : {}
        } as EventsDTO);

        if (typeof data === 'boolean') {
          return response.status(200).send(data);
        }

        return response.status(200).send(Object.values(data));
      } catch (error) {
        // No providers left, raising last error
        if (providerIndex === this.eventsUseCase.contractProvider.web3Providers.length - 1) {
          return response.status(500).json({
            message: error.message || 'Unexpected contract call error.'
          });
        }
      }
    }
  }
}
