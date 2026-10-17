'use client';
import React from 'react';
import { WardInfo,ParentQuery } from '../types';
import { RecordList } from '../components/record-list';
export function NoticesPane({selectedWard,queriesList,onOpenQueryModal}: {selectedWard:WardInfo;queriesList:ParentQuery[];onOpenQueryModal:()=>void}) {
  return <div className="space-y-5"><h2 className="text-xl font-bold">School notices</h2><RecordList title="Published notices" rows={selectedWard.data?.notices || []} columns={[["subject","Subject"],["body","Message"],["date","Date"]]}/><button onClick={onOpenQueryModal}>Send query</button><RecordList title="Your queries" rows={queriesList} columns={[["subject","Subject"],["queryText","Query"],["status","Status"],["response","Response"]]}/></div>;
}
