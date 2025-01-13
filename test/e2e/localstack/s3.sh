#!/bin/bash

awslocal s3api create-bucket --bucket localstack-debug-plans --create-bucket-configuration LocationConstraint=ap-southeast-2
