## Summary

Improve the project documentation by adding a short explanation of how the Neural-News pipeline processes and distributes news.

## Changes

* Added a high-level explanation of the news processing workflow.
* Documented the main stages from fetching news to distribution.
* Clarified the purpose of the major pipeline components for new contributors.

## Why

The project contains multiple processing stages, and a new contributor may need to inspect several source files to understand how news moves through the system.

This documentation makes the architecture easier to understand without changing application behavior.

## Testing

No application logic was changed, so no functional behavior is expected to change.
