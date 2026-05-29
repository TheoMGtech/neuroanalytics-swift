from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class StoreResultBase(BaseModel):
    storeName: str
    flag: str
    totalReviews: int
    nps: float
    promoters: int
    neutral: int
    detractors: int
    isOutlier: bool

class CommentResultBase(BaseModel):
    storeName: str
    commentText: str
    sentiment: str
    category: str
    confidence: float

class ManagementSummaryBase(BaseModel):
    flag: str
    totalReviews: int
    nps: float
    promoters: int
    neutral: int
    detractors: int

class AnalysisResponse(BaseModel):
    id: int
    fileName: str
    createdAt: datetime
    totalReviews: int
    generalNps: float
    promoters: int
    neutral: int
    detractors: int
    saved: bool
    storeResults: Optional[List[StoreResultBase]] = None
    commentResults: Optional[List[CommentResultBase]] = None
    managementSummary: Optional[List[ManagementSummaryBase]] = None
