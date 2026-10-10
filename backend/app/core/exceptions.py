from fastapi import HTTPException, status

class NutanaException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class EntityNotFoundException(NutanaException):
    def __init__(self, entity_name: str, entity_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name} with ID '{entity_id}' not found."
        )

class InsufficientStockException(NutanaException):
    def __init__(self, product_name: str, requested: float, available: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient sellable stock for '{product_name}'. Requested: {requested}, Available: {available}."
        )

class InvalidStateTransitionException(NutanaException):
    def __init__(self, current_state: str, attempted_action: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot perform '{attempted_action}' on item in '{current_state}' status."
        )

class UnauthorizedAccessException(NutanaException):
    def __init__(self, message: str = "Not authorized to access this resource"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )
