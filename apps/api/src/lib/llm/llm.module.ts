import { Global, Inject, Injectable, Module, type Provider } from '@nestjs/common';

import { ENV } from '../config/config.module';
import type { Env } from '../config/env';

import { MockLlmVendor } from './mock.vendor';
import { OpenAiLlmVendor } from './openai.vendor';
import { LLM_VENDOR_TOKEN, type LlmVendor, type VendorName } from './types';

/**
 * Bootstraps the active LlmVendor from ENV.LLM_VENDOR. Adding a new vendor is a
 * single-file change here plus a new `*.vendor.ts`. No controller or service
 * imports a vendor directly — they all consume LlmService below.
 */
function pickVendor(env: Env, mock: MockLlmVendor, openai: () => OpenAiLlmVendor): LlmVendor {
  const name: VendorName = env.LLM_VENDOR;
  switch (name) {
    case 'mock':
      return mock;
    case 'openai':
      return openai();
    case 'azure-openai':
    case 'local':
      throw new Error(
        `LLM_VENDOR=${name} is reserved but not yet implemented. Use 'mock' for dev or 'openai' once contracts land.`,
      );
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown LLM_VENDOR: ${String(exhaustive)}`);
    }
  }
}

@Injectable()
export class LlmService implements LlmVendor {
  constructor(@Inject(LLM_VENDOR_TOKEN) private readonly vendor: LlmVendor) {}

  get name() {
    return this.vendor.name;
  }

  generate(input: Parameters<LlmVendor['generate']>[0]) {
    return this.vendor.generate(input);
  }

  embed(texts: string[]) {
    return this.vendor.embed(texts);
  }
}

const vendorProvider: Provider = {
  provide: LLM_VENDOR_TOKEN,
  inject: [ENV, MockLlmVendor],
  useFactory: (env: Env, mock: MockLlmVendor): LlmVendor =>
    // OpenAiLlmVendor is constructed lazily so its OPENAI_API_KEY check only
    // runs when actually selected; in dev with LLM_VENDOR=mock we never touch it.
    pickVendor(env, mock, () => new OpenAiLlmVendor(env)),
};

@Global()
@Module({
  providers: [MockLlmVendor, vendorProvider, LlmService],
  exports: [LlmService, LLM_VENDOR_TOKEN],
})
export class LlmModule {}
