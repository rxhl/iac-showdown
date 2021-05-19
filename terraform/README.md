## Books API with Terraform

Make sure you have the Terraform CLI installed.

```bash
# zip the lambda function
$ zip ./tflambda.zip tflambda.js

# initialize working directory
$ terraform init

# validate the terraform template
$ terraform validate

# push the app
$ terraform apply

# cleanup
$ terraform destroy
```
