# Placeholder for Zarinpal SOAP/REST integration.
# Implement request_payment(amount, description, callback_url) and verify_payment(authority).
def request_payment(amount, description, callback_url):
    # TODO: integrate Zarinpal client here
    return {'authority': 'TEST', 'url': 'https://sandbox.zarinpal.com/pg/StartPay/TEST'}

def verify_payment(authority):
    # TODO: verify payment with Zarinpal and return status/refID
    return {'ok': True, 'ref_id': '0000000000'}
