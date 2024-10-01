#!/bin/bash

export AWS_DEFAULT_REGION=ap-southeast-2

awslocal dynamodb create-table \
    --table-name plangen_async_task \
    --key-schema AttributeName=transactionId,KeyType=HASH AttributeName=taskId,KeyType=RANGE \
    --attribute-definitions AttributeName=transactionId,AttributeType=N AttributeName=taskId,AttributeType=S \
    --billing-mode PAY_PER_REQUEST

awslocal dynamodb update-time-to-live \
    --table-name plangen_async_task \
    --time-to-live-specification Enabled=true,AttributeName=expirationTime
