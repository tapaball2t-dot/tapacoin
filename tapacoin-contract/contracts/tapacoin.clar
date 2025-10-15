;; Tapacoin (TAPA) - A Stacks-based fungible token
;; Compatible with SIP-010 fungible token standard

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-token-owner (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-invalid-amount (err u103))
(define-constant err-token-already-exists (err u104))
(define-constant err-token-not-found (err u105))

;; Token definition
(define-fungible-token tapacoin)

;; Data variables
(define-data-var token-name (string-ascii 32) "Tapacoin")
(define-data-var token-symbol (string-ascii 10) "TAPA")
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var token-decimals uint u6)

;; Data maps
(define-map approved-contracts principal bool)

;; Private functions
(define-private (is-dao-or-extension)
  (or (is-eq tx-sender contract-owner)
      (default-to false (map-get? approved-contracts tx-sender))))

;; Read-only functions
(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (ok (var-get token-decimals)))

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance tapacoin who)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply tapacoin)))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

;; Public functions

;; SIP-010 Transfer function
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    (asserts! (or (is-eq from tx-sender) (is-eq from contract-caller)) err-not-token-owner)
    (asserts! (> amount u0) err-invalid-amount)
    (ft-transfer? tapacoin amount from to)))

;; Mint function - only contract owner can mint
(define-public (mint (amount uint) (to principal))
  (begin
    (asserts! (is-dao-or-extension) err-owner-only)
    (asserts! (> amount u0) err-invalid-amount)
    (ft-mint? tapacoin amount to)))

;; Burn function
(define-public (burn (amount uint) (from principal))
  (begin
    (asserts! (or (is-eq from tx-sender) (is-dao-or-extension)) err-not-token-owner)
    (asserts! (> amount u0) err-invalid-amount)
    (ft-burn? tapacoin amount from)))

;; Set token URI - only owner
(define-public (set-token-uri (value (optional (string-utf8 256))))
  (begin
    (asserts! (is-dao-or-extension) err-owner-only)
    (ok (var-set token-uri value))))

;; Approve contract for minting/burning
(define-public (set-contract-approved (contract principal) (approved bool))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (ok (map-set approved-contracts contract approved))))

;; Get contract approval status
(define-read-only (is-contract-approved (contract principal))
  (default-to false (map-get? approved-contracts contract)))

;; Initialize with initial supply (run once)
(define-public (initialize (initial-supply uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (is-eq (ft-get-supply tapacoin) u0) err-token-already-exists)
    (ft-mint? tapacoin initial-supply recipient)))

;; Administrative functions

;; Transfer ownership (if needed in future)
(define-read-only (get-contract-owner)
  contract-owner)

;; Utility functions for batch operations
(define-public (transfer-many (transfers (list 100 {amount: uint, from: principal, to: principal, memo: (optional (buff 34))})))
  (fold check-transfer-many transfers (ok true)))

(define-private (check-transfer-many (transfer-data {amount: uint, from: principal, to: principal, memo: (optional (buff 34))}) (prior-result (response bool uint)))
  (match prior-result 
    success (transfer (get amount transfer-data) (get from transfer-data) (get to transfer-data) (get memo transfer-data))
    error (err error)))

