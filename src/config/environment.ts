const environmentConfigVariables = [
  'PREDICTION_MARKET_CONTRACT_ADDRESS',
  'ERC20_CONTRACT_ADDRESS',
  'REALITIO_ERC20_CONTRACT_ADDRESS',
  'WEB3_PROVIDER',
  'ORIGIN_WHITELIST'
] as const;

export type EnvironmentConfigVariable =
  typeof environmentConfigVariables[number];

export type EnvironmentConfig = {
  [_variable in typeof environmentConfigVariables[number]]: string | undefined;
};

/**
 * This method will retrieve any configuration variable.
 * @param variable
 * @returns string | undefined
 */
function getEnvironmentConfigVariable(
  variable: EnvironmentConfigVariable
): string | undefined {
  if (!(`${variable}` in process.env)) {
    throw new Error(`Environment variable ${variable} is undefined!`);
  }
  return process.env[`${variable}`];
}

function buildEnvironmentConfigObject() {
  return environmentConfigVariables.reduce(
    (acc, variable) => ({
      ...acc,
      [variable]: getEnvironmentConfigVariable(variable)
    }),
    {} as EnvironmentConfig
  );
}

const environmentConfig = buildEnvironmentConfigObject();

export default environmentConfig;
