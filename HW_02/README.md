## Users API

### - Creating a user
| Endpoint | Method   | 
| -------- | -------- | 
| /users   | POST     |

##### Headers
`None`

##### Payload - All fields are required. `userName` should be unique among all the users.
```
{
  "userName": "khalfella",
  "firstName": "Mohamed_123",
  "lastName": "Khalfella",
  "password":"password",
  "email": "khalfella@gmail.com",
  "address":"1234 Street - XX 5555"
}
```
##### Example
```
# curl -s localhost:3000/users -X POST -d @- -o -<<EOF | json
{
  "userName": "khalfella",
  "firstName": "Mohamed_123",
  "lastName": "Khalfella",
  "password":"password",
  "email": "khalfella@gmail.com",
  "address":"1234 Street - XX 5555"
}
EOF

{
  "uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "userName": "khalfella",
  "firstName": "Mohamed_123",
  "lastName": "Khalfella",
  "email": "khalfella@gmail.com",
  "address": "1234 Street - XX 5555"
}
#
```








### - Retreiving User Information
| Endpoint          | Method   | 
| ----------------- | -------- | 
| /users/:user_uuid | GET      |

##### Headers

| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| token     | A valid token for the user.      | Yes       |

##### Payload - All fields are required. `userName` should be unique among all the users.
```
None
```
##### Example
```
# curl  -s localhost:3000/users/f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3  -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' | json
{
  "uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "userName": "khalfella",
  "firstName": "Mohamed_123",
  "lastName": "Khalfella",
  "email": "khalfella@gmail.com",
  "address": "1234 Street - XX 5555"
}
#
```


### - Updating User Information
| Endpoint          | Method   | 
| ----------------- | -------- | 
| /users/:user_uuid | PUT      |

##### Headers

| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| token     | A valid token for the user.      | Yes       |

##### Payload - All fields are updatable, except the user's uuid.

```
{
  "userName": "new_user_name",
  "firstName": "new_first_name",
  "lastName": "new_last_name",
  "email": "new_email_address",
  "address": "new_address"
}
```
##### Example

```
# curl  -s localhost:3000/users/f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3 -X PUT -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' -d @- <<EOF| json
> {
>   "firstName": "Mohamed_456"
> }
> EOF
{
  "uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "userName": "khalfella",
  "firstName": "Mohamed_456",
  "lastName": "Khalfella",
  "email": "khalfella@gmail.com",
  "address": "1234 Street - XX 5555"
}
# 
```



### - Deleting a User
| Endpoint          | Method   | 
| ----------------- | -------- | 
| /users/:user_uuid | DELETE   |

##### Headers

| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| token     | A valid token for the user.      | Yes       |

##### Payload - All fields are updatable, except the user's uuid.

```
None
```
##### Example

```
# curl  -s localhost:3000/users/f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3 -X DELETE -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' | json
{
  "uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3"
}
#
```




### Tokens API

#### Creating a token
| Endpoint | Method   | 
| -------- | -------- | 
| /tokens  | POST     |

##### Headers - Either username or user_uuid headers is required

| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | No       |
| username  | Username.                        | No       |
| password  | Users password.                  | Yes      |

##### Payload - All fields are required. `userName` should be unique among all the users.
```
None
```
##### Example
```
# curl -s localhost:3000/tokens -X POST -H 'userName: khalfella' -H 'password: password' | json
{
  "uuid": "d952fdad-91b4-0a01-577f-dafe95a49ab7",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "expiration": 1546130517113
}
# curl  -s localhost:3000/tokens -X POST -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' -H 'password: password' | json
{
  "uuid": "e2e7f08a-aabb-f85b-d5e1-4837eeef0702",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "expiration": 1546130524351
}
#
```




#### Retreiving a token information
| Endpoint            | Method   | 
| ------------------- | -------- | 
| /tokens/:token_uuid | GET      |

##### Headers - Either username or user_uuid headers is required
```
None
```

##### Payload
```
None
```
##### Example
```
# curl -s localhost:3000/tokens/d952fdad-91b4-0a01-577f-dafe95a49ab7 | json
{
  "uuid": "d952fdad-91b4-0a01-577f-dafe95a49ab7",
  "expiration": 1546131737745
}
#
```


#### Deleting a token - logout
| Endpoint            | Method   | 
| ------------------- | -------- | 
| /tokens/:token_uuid | DELETE   |

##### Headers - Either username or user_uuid headers is required
| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | Yes      |
##### Payload
```
None
```
##### Example
```
# curl  -s localhost:3000/tokens/fa850034-3daf-2bcc-4317-cc30a21fc6ff -X DELETE -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' | json
{
  "uuid": "fa850034-3daf-2bcc-4317-cc30a21fc6ff"
}
#
```














#### Creating a cart
| Endpoint     | Method   | 
| ------------ | -------- | 
| /carts       | POST     |

##### Headers - Either username or user_uuid headers is required
| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | Yes      |
| token     | A valid user's token.            | Yes      |

##### Payload - This creates an empty cart.
```
None
```
##### Example
```
# curl  -s localhost:3000/carts -X POST -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' | json
{
  "uuid": "2a76bdf4-be9f-7793-a63c-535ab0d9a52f",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "user_email": "khalfella@gmail.com",
  "items": [],
  "total_price": 0
}
#
```




#### Creating a cart
| Endpoint     | Method   | 
| ------------ | -------- | 
| /carts       | GET      |

##### Headers - Either username or user_uuid headers is required
| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | Yes      |
| token     | A valid user's token.            | Yes      |

##### Payload - This creates an empty cart.
```
None
```
##### Example
```
# curl  -s localhost:3000/carts -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' | json
{
  "uuid": "2a76bdf4-be9f-7793-a63c-535ab0d9a52f",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "user_email": "khalfella@gmail.com",
  "items": [],
  "total_price": 0
}
#
```





#### Updating a cart
| Endpoint          | Method   | 
| ----------------- | -------- | 
| /carts/:cart_uuid | PUT      |

##### Headers - Either username or user_uuid headers is required
| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | Yes      |
| token     | A valid user's token.            | Yes      |

##### Payload - This set 3 the quantity of the a specific item in the cart.
```
[
  {
    "uuid": "d401911c-0a19-11e9-97e5-8b03d4d144a4",
    "quantity": 3
  }
]
```
##### Example

```
# curl  -s localhost:3000/carts/2a76bdf4-be9f-7793-a63c-535ab0d9a52f -X PUT -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' -d @- <<EOF | json
> [
>   {
>     "uuid": "d401911c-0a19-11e9-97e5-8b03d4d144a4",
>     "quantity": 3
>   }
> ]
> EOF
{
  "uuid": "2a76bdf4-be9f-7793-a63c-535ab0d9a52f",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "user_email": "khalfella@gmail.com",
  "items": [
    {
      "uuid": "d401911c-0a19-11e9-97e5-8b03d4d144a4",
      "quantity": 3
    }
  ],
  "total_price": 60
}
#
```















##### Placing an order
| Endpoint  | Method   | 
| --------- | -------- | 
| /orders   | POST     |

##### Headers - Either username or user_uuid headers is required
| Header    | Description                      | Required |
| --------  | -------------------------------- | -------- |
| user_uuid | User UUID to create a token for. | Yes      |
| token     | A valid user's token.            | Yes      |

##### Payload - This place an order and charges the customer with the cart total price. It also sends an email to the customer.
```
{
  "cart_uuid": "2a76bdf4-be9f-7793-a63c-535ab0d9a52f",
  "creditCardNumber": "4242424242424242",
  "creditCardExpMonth": 12,
  "creditCardExpYear": 2019,
  "creditCardCVC": 123
}
```
##### Example

```
# curl  -s localhost:3000/orders -X POST -H 'user_uuid: f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3' -H 'token: d952fdad-91b4-0a01-577f-dafe95a49ab7' -d @- <<EOF | json
> {
>   "cart_uuid": "2a76bdf4-be9f-7793-a63c-535ab0d9a52f",
>   "creditCardNumber": "4242424242424242",
>   "creditCardExpMonth": 12,
>   "creditCardExpYear": 2019,
>   "creditCardCVC": 123
> }
> EOF
{
  "uuid": "dfdf5dc8-e3bf-12f5-a8cb-92a1a83903d4",
  "user_uuid": "f55da2fa-c9aa-8022-e94a-7f9ae1d57bb3",
  "user_email": "khalfella@gmail.com",
  "creation_date": 1546046904480,
  "total_price": 60,
  "items": [
    {
      "uuid": "d401911c-0a19-11e9-97e5-8b03d4d144a4",
      "quantity": 3,
      "price": 60
    }
  ],
  "charge_id": "ch_1DmWcn2eZvKYlo2Cq6ifxmIs"
}
#
```

