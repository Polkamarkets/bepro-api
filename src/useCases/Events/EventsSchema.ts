import * as yup from 'yup';

export const eventsSchema = yup.object({
  contract: yup
    .mixed()
    .oneOf(['predictionMarket', 'erc20', 'realitio', 'achievements'])
    .required('Contract is required!'),
  eventName: yup.string().required('Event name is required!'),
  address: yup.string().required('Address is required!')
});
