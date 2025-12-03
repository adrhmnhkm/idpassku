# API indo-vault

Base URL default: http://localhost:5000

## Auth
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me  (requires Authorization: Bearer token)

## Vault
GET    /vault/items
POST   /vault/items       { ciphertext }
PUT    /vault/items/:id   { ciphertext, version }
DELETE /vault/items/:id
