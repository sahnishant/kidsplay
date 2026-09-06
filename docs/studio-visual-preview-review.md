# Live visual preview correction

Review of the new shared visual-preview path found that its order was copied only when the child chose Look at my order. Subsequent card edits could keep showing the earlier order, even though the saved construction was current. The host now updates an already-open preview from the renderer's validated current response. It never reads the solution for Explore previews.

The36 matrix journeys now swap cards, open the child preview, swap again and assert both the picture and source label return to the child's actual first item. This is also checked for Fire Station, where text is longer. The reload helper now accepts restored Show me mode rather than requiring an ordering engine to be mounted in every mode.

These are regression assertions awaiting the resulting exact-head run, not evidence of a completed human review or a new learning activity.
