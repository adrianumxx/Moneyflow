# Security Specification - Moneyflow Financial Advisor

## Data Invariants
1. A transaction must belong to a user and have a valid amount and type.
2. Assets and liabilities are strictly private to the owner.
3. Groups require membership for any read/write operation.
4. AI Insights are generated per user and are private.

## The Dirty Dozen Payloads (Targeting Moneyflow)
1. **Identity Spoofing**: Attempt to create an asset for another user's ID.
2. **Resource Poisoning**: Use a 2MB string as a transaction description.
3. **Privilege Escalation**: Adding oneself to a group without being invited.
4. **Data Leak**: Reading another user's financial goals.
5. **State Manipulation**: Setting a goal as 'completed' without reaching the target.
6. **Negative Wealth**: Creating a liability with a negative remaining amount (if not allowed).
7. **Orphaned Writes**: Creating a transaction referencing a non-existent bank account.
8. **Shadow Fields**: Adding `isVip: true` to a user profile.
9. **Update Gap**: Changing the `ownerId` of an asset during an update.
10. **Timestamp Fraud**: Providing a future `createdAt` date for a transaction.
11. **PII Leak**: Querying for all user emails who are 'wealthy'.
12. **Group Hijack**: Removing an admin from a group as a regular member.

## Test Strategy
- Verify `isOwner()` guards all `/users/{userId}/**` paths.
- Verify `isValid[Entity]()` checks key count and types.
- Verify `affectedKeys().hasOnly()` during updates.
