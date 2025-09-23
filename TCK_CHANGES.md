# TCK

## Changes made

* deleted dcat from all the DSP implementation
* modified @context to array of string
* implement condition in state management not describe un IDSA
* TP:03-03
`/transfers/{providerPid}/start`
```json
{
  "@context": ["https://w3id.org/dspace/2025/1/context.jsonld"],
  "@type": "TransferStartMessage",
  "providerPid": "urn:uuid:a95a50c5-01b1-4b73-b814-be915f87207d",
  "consumerPid": "7bbcceb5-f81c-4e58-9e22-114f90ac0fcb"
}
```
* Where is described the POST /transfers endpoint ?
* cat_01_01 → Binding on /.well-known/dspace-version ?