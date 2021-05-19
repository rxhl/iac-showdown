## Books API with AWS CloudFormation

Make sure you have AWS CLI installed.

```bash
aws cloudformation create-stack \
--stack-name my-cf-stack \
--template-body file://template.json \
--capabilities CAPABILITY_IAM
```
