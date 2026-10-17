'use client';
import React,{useEffect,useRef,useState} from 'react';
import { api,updateStudentLectureProgress,toggleStudentBookmark } from '../../edops-api';
export function LecturePlayerModal({isOpen,onClose,organizationId,lecture,onSuccess}: {isOpen:boolean;onClose:()=>void;organizationId:string;lecture:any;onSuccess?:()=>void}) {
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[bookmarked,setBookmarked]=useState(false),[saving,setSaving]=useState(false);
  const video=useRef<HTMLVideoElement>(null);
  useEffect(()=>{let active=true;setUrl('');setError('');setBookmarked(!!lecture?.isBookmarked);if(isOpen&&lecture)api<any>(`/organizations/${organizationId}/recordings/${lecture.id}/playback`).then(data=>{if(active)setUrl(data.url);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[isOpen,organizationId,lecture?.id]);
  if (!isOpen||!lecture) return null;
  const save=async()=>{const v=video.current;if(!v||!Number.isFinite(v.duration)||!v.duration)return;setSaving(true);try{await updateStudentLectureProgress(organizationId,lecture.id,{lastPositionSeconds:Math.floor(v.currentTime),watchedPct:Math.min(100,Math.round(100*v.currentTime/v.duration)),isCompleted:v.ended});onSuccess?.();}catch(e){setError(e instanceof Error?e.message:'Progress could not be saved');}finally{setSaving(false);}};
  return <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><div className="bg-white rounded-2xl p-5 max-w-3xl w-full space-y-4"><div className="flex justify-between"><h2 className="font-bold">{lecture.title}</h2><button onClick={onClose}>Close</button></div>{error&&<p role="alert" className="text-red-700">{error}</p>}
    {url?<video ref={video} controls className="w-full" src={url} onLoadedMetadata={()=>{if(video.current)video.current.currentTime=lecture.lastPositionSeconds || 0;}} onPause={save} onEnded={save}/>:<p>Loading recording…</p>}
    <p>{lecture.subject} · {lecture.teacher}</p>{saving&&<p>Saving progress…</p>}
    <button onClick={async()=>{try{const saved=await toggleStudentBookmark(organizationId,{resourceId:lecture.id,resourceType:'recorded_lecture',title:lecture.title,subjectName:lecture.subject,url:`/organizations/${organizationId}/recordings/${lecture.id}/playback`});setBookmarked(saved.isBookmarked);}catch(e){setError(e instanceof Error?e.message:'Bookmark could not be saved');}}}>{bookmarked?'Remove bookmark':'Bookmark recording'}</button>
  </div></div>;
}
