'''
The following JSON template shows what is sent as the payload:
{
    "serialNumber": "GXXXXXXXXXXXXXXXXX",
    "batteryVoltage": "xxmV",
    "clickType": "SINGLE" | "DOUBLE" | "LONG"
}

A "LONG" clickType is sent if the first press lasts longer than 1.5 seconds.
"SINGLE" and "DOUBLE" clickType payloads are sent for short clicks.

For more documentation, follow the link below.
http://docs.aws.amazon.com/iot/latest/developerguide/iot-lambda-rule.html
'''

from __future__ import print_function

import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    event_string = json.dumps(event)
    logging.info('Received event: ' + event_string)

    sqs = boto3.resource('sqs')
    queue = sqs.get_queue_by_name(QueueName='iot-button-event')

    response = queue.send_message(MessageBody=event_string)
    logging.info(response.get('MessageId'))

    return event_string
