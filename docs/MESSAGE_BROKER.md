# Message Broker

Multiple workflow are possible, such as:

## Push or Pull to publish message
> local PDC configuration define the unique message broker server and queue/topic
> message received by who trigger the exchange
```mermaid
sequenceDiagram
    participant Queue
    participant Provider PDC
    participant Consumer PDC
    Note over Provider PDC: Exchange triggered POST /exchange
    Note over Provider PDC: Verify contract
    Provider PDC->>Consumer PDC: transfer exchange data
    Note over Consumer PDC: verify contract
    Consumer PDC-->>Provider PDC: Change data exchange status to TRANSFER_STARTED
    Provider PDC-->>Queue: publish message on websocket or message broker
    Note over Provider PDC: return response with status
```

```mermaid
sequenceDiagram
    participant Provider PDC
    participant Consumer PDC
    participant Publisher
    Note over Consumer PDC: Exchange triggered POST /exchange
    Consumer PDC->>Provider PDC: Start exchange order
    Note over Provider PDC: Verify contract
    Provider PDC->>Consumer PDC: transfer exchange data
    Note over Consumer PDC: verify contract
    Consumer PDC-->>Provider PDC: Change data exchange status to TRANSFER_STARTED
    Consumer PDC-->>Publisher: publish message on websocket or message broker
```

## Provider data is published in queue by the consumer connector

> The consumer can push provider data to message broker
> Metadata on the software representation define the message broker connection info

```mermaid
sequenceDiagram
    participant Provider Resource
    participant Provider PDC
    participant Consumer PDC
    participant Message Broker
    Note over Consumer PDC, Provider PDC: Exchange triggered POST /exchange
    Provider PDC->>Provider Resource: Get data
    Provider Resource-->>Provider PDC: Return data
    Provider PDC->>Consumer PDC: transfer Data
    Note over Consumer PDC: verify contract + resource are Message Broker type
    Consumer PDC-->>Message Broker: publish data to message broker
    Note over Consumer PDC: return response with status + can publish message on websocket or message broker
```
> only for software Representation

```json
[
  {
    "_id": {
      "$oid": "696607fbfb278a716f8ba398"
    },
    "method": "none",
    "resourceID": "696607fbfb278a716f8ba395",
    "type": "MESSAGE_BROKER",
    "broker": {
      "topic": "data_exchange_topic",//kafka
      "brokerType": "kafka", //websocket, amqp, mqtt
      "credentials": "696607fbfb278a716f8ba398",
      "host": "broker.example.com",
      "port": 9092,
      "queue": "data_exchange_queue",//amqp, mqtt
      "uri": "" //websoket
    },
    ... // Other common representation fields
  }
]
```

## Provider subscribe to queue and push message to consumer

```mermaid
sequenceDiagram
    participant Provider Message Broker
    participant Provider PDC
    participant Consumer PDC
    participant Consumer Message Broker
    Note over Consumer PDC, Provider PDC: Exchange triggered POST /exchange
    Provider PDC->>Provider Message Broker: Subscribe to queue/topic
    Provider Message Broker-->>Provider PDC: get message/data
    Provider PDC->>Consumer PDC: transfer message
    Note over Consumer PDC: verify contract + resource are Message Broker type
    Consumer PDC-->>Message Broker: publish lessage broker
```

> Data representation allow to subscribe to message broker and push message/data to consumer
> Software Representation allow to publish to a queue/topic

```json
[
  {
    "_id": {
      "$oid": "696607fbfb278a716f8ba398"
    },
    "method": "none",
    "resourceID": "696607fbfb278a716f8ba395",
    "type": "MESSAGE_BROKER",
    "broker": {
      "topic": "data_exchange_topic",//kafka
      "brokerType": "kafka", //websocket, amqp, mqtt
      "credentials": "696607fbfb278a716f8ba398",
      "host": "broker.example.com",
      "port": 9092,
      "queue": "data_exchange_queue",//amqp, mqtt
      "uri": "" //websoket
    },
    ... // Other common representation fields
  }
]
```

## Other flows

- Provider can push message to data broker