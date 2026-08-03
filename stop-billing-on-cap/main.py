import base64
import json
import os
from decimal import Decimal, InvalidOperation

import functions_framework
from google.cloud import billing_v1


PROJECT_ID = (
    os.environ.get("TARGET_PROJECT_ID")
    or os.environ.get("GOOGLE_CLOUD_PROJECT")
    or os.environ.get("GCP_PROJECT")
)
KILL_SWITCH_ENABLED = os.environ.get("BILLING_KILL_SWITCH_ENABLED", "false").lower() == "true"


@functions_framework.cloud_event
def stop_billing(cloud_event):
    """Disables project billing when a budget alert reaches its budget amount."""
    if not PROJECT_ID:
        raise RuntimeError("TARGET_PROJECT_ID is not configured")

    message = (cloud_event.data or {}).get("message", {})
    encoded_data = message.get("data")
    if not encoded_data:
        raise ValueError("Budget alert did not contain Pub/Sub message data")

    try:
        budget_alert = json.loads(base64.b64decode(encoded_data).decode("utf-8"))
        cost_amount = Decimal(str(budget_alert["costAmount"]))
        budget_amount = Decimal(str(budget_alert["budgetAmount"]))
    except (KeyError, TypeError, ValueError, InvalidOperation) as error:
        raise ValueError("Budget alert has an invalid payload") from error

    print(f"Current cost: {cost_amount}, budget: {budget_amount}")
    if cost_amount < budget_amount:
        print("Under budget. No action taken.")
        return

    project_name = f"projects/{PROJECT_ID}"
    if not KILL_SWITCH_ENABLED:
        print(
            f"Budget exceeded for {project_name}. Log-only mode is active; billing remains enabled."
        )
        return

    print(f"Budget exceeded. Disabling billing for {project_name}.")
    unlink_billing_account(project_name)


def unlink_billing_account(project_name):
    billing_client = billing_v1.CloudBillingClient()
    project_billing_info = billing_v1.ProjectBillingInfo(billing_account_name="")
    request = billing_v1.UpdateProjectBillingInfoRequest(
        name=project_name,
        project_billing_info=project_billing_info,
    )

    response = billing_client.update_project_billing_info(request=request)
    print(f"Successfully disabled billing for {project_name}")
    print(response)
