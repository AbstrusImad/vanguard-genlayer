"""Direct tests for Vanguard contract — deterministic logic only.

Tests: constructor, views, create_bounty, submit_work, cancel_bounty,
appeal_evaluation, settle_bounty, permissions, lifecycle guards, pagination.
"""
from gltest import get_contract_factory
from gltest.assertions import tx_execution_succeeded

ONE_GEN = 10 ** 18


def test_constructor_and_stats():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    stats = contract.get_stats(args=[]).call()
    assert stats["bounties"] == 0
    assert stats["submissions"] == 0
    assert stats["evaluations"] == 0
    assert stats["appeals"] == 0


def test_create_bounty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Write a Python REST API", "Engineering",
              "Build a Flask REST API with CRUD endpoints for a todo list, including tests and documentation."],
    ).transact(value=5 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    bounties = contract.get_bounties(args=[0]).call()
    assert len(bounties) == 1
    b = bounties[0]
    assert b["id"] == "BNT-1"
    assert b["title"] == "Write a Python REST API"
    assert b["category"] == "Engineering"
    assert b["status"] == "OPEN"
    assert int(b["reward_atto"]) == 5 * ONE_GEN

    stats = contract.get_stats(args=[]).call()
    assert stats["bounties"] == 1


def test_create_bounty_below_minimum():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task", "Cat", "Do something"],
    ).transact(value=100)
    # Should fail — minimum reward is 1 GEN (10**18 atto)
    assert not tx_execution_succeeded(tx)


def test_submit_work():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Write article", "Writing",
              "Write a 500-word article about blockchain technology and its applications."],
    ).transact(value=3 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    # Same account submits work (in production, different accounts would be used)
    tx = contract.submit_work(
        args=["BNT-1",
              "This is my comprehensive article about blockchain technology covering "
              "consensus mechanisms, smart contracts, decentralized applications, "
              "supply chain tracking, digital identity verification, and cross-border "
              "payments across multiple industries and use cases."],
    ).transact()
    # Sponsor submitting own bounty should fail
    assert not tx_execution_succeeded(tx)


def test_submit_work_unknown_bounty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.submit_work(
        args=["BNT-999", "My work submission content here for a nonexistent bounty."],
    ).transact()
    assert not tx_execution_succeeded(tx)


def test_cancel_bounty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task to cancel", "General",
              "A task that will be cancelled before any submissions are made."],
    ).transact(value=2 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    tx = contract.cancel_bounty(args=["BNT-1"]).transact()
    assert tx_execution_succeeded(tx)

    bounty = contract.get_bounty(args=["BNT-1"]).call()
    assert bounty["status"] == "CANCELLED"


def test_cancel_unknown_bounty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.cancel_bounty(args=["BNT-999"]).transact()
    assert not tx_execution_succeeded(tx)


def test_appeal_requires_awarded():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task", "General", "A task for appeal state guard testing."],
    ).transact(value=2 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    # Bounty is OPEN, not AWARDED — appeal should fail
    tx = contract.appeal_evaluation(
        args=["BNT-1", "The evaluation was incorrect because the work was complete."],
    ).transact()
    assert not tx_execution_succeeded(tx)


def test_settle_requires_awarded():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task", "General", "A task for settle state guard testing."],
    ).transact(value=2 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    # Bounty is OPEN, not AWARDED — settle should fail
    tx = contract.settle_bounty(args=["BNT-1"]).transact()
    assert not tx_execution_succeeded(tx)


def test_chronicle_events():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Tracked task", "General", "A task to verify chronicle event logging."],
    ).transact(value=1 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    events = contract.get_chronicle(args=[0]).call()
    assert len(events) >= 1
    assert events[0]["event"] == "bounty_created"

    # Cancel should also log
    tx = contract.cancel_bounty(args=["BNT-1"]).transact()
    assert tx_execution_succeeded(tx)

    events = contract.get_chronicle(args=[0]).call()
    assert len(events) >= 2
    assert events[-1]["event"] == "bounty_cancelled"


def test_pagination_empty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    bounties = contract.get_bounties(args=[0]).call()
    assert len(bounties) == 0


def test_pagination_beyond_end():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Only one", "General", "Single bounty for pagination boundary test."],
    ).transact(value=1 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    bounties = contract.get_bounties(args=[100]).call()
    assert len(bounties) == 0


def test_reputation_default():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    rep = contract.get_reputation(args=["0x2222222222222222222222222222222222222222"]).call()
    assert rep["approved"] == 0
    assert rep["rejected"] == 0
    assert rep["total_score"] == 0


def test_get_bounty_unknown():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    try:
        contract.get_bounty(args=["BNT-999"]).call()
        assert False, "Expected error for unknown bounty"
    except Exception:
        pass


def test_multiple_bounties():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    for i in range(3):
        tx = contract.create_bounty(
            args=[f"Task {i+1}", "General", f"Description for task number {i+1} in the pagination test suite."],
        ).transact(value=1 * ONE_GEN)
        assert tx_execution_succeeded(tx)

    bounties = contract.get_bounties(args=[0]).call()
    assert len(bounties) == 3
    assert bounties[0]["id"] == "BNT-1"
    assert bounties[2]["id"] == "BNT-3"

    stats = contract.get_stats(args=[]).call()
    assert stats["bounties"] == 3


def test_evaluate_requires_submitted():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task", "General", "A task for evaluate state guard testing."],
    ).transact(value=2 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    # Bounty is OPEN, no submissions — evaluate should fail
    tx = contract.evaluate_submission(args=["BNT-1"]).transact()
    assert not tx_execution_succeeded(tx)


def test_get_submissions_empty():
    factory = get_contract_factory("Vanguard")
    contract = factory.deploy(args=[])
    tx = contract.create_bounty(
        args=["Task", "General", "A task to verify get_submissions returns empty list."],
    ).transact(value=1 * ONE_GEN)
    assert tx_execution_succeeded(tx)

    subs = contract.get_submissions(args=["BNT-1"]).call()
    assert len(subs) == 0
