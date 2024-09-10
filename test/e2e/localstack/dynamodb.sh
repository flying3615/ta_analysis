#!/bin/bash

export AWS_DEFAULT_REGION=ap-southeast-2

awslocal dynamodb create-table \
    --table-name plangen_prepare_dataset_status \
    --key-schema AttributeName=transactionId,KeyType=HASH \
    --attribute-definitions AttributeName=transactionId,AttributeType=N \
    --billing-mode PAY_PER_REQUEST
