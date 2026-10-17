'use client';
import React,{useEffect,useState} from 'react';
import { submitStudentArenaAttempt } from '../../edops-api';
export function ArenaAttemptModal({isOpen,onClose,organizationId,activity,onSuccess}: {isOpen:boolean;onClose:()=>void;organizationId:string;activity:any;onSuccess?:()=>void}) {
  const [index,setIndex]=useState(0),[selected,setSelected]=useState<number[]>([]),[result,setResult]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[score,setScore]=useState(0),[finished,setFinished]=useState(false);
  useEffect(()=>{setIndex(0);setSelected([]);setResult(null);setError('');setScore(0);setFinished(false);},[isOpen,activity?.id]);
  if (!isOpen||!activity) return null;
  const questions=activity.questions || [],question=questions[index];
  return <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-4"><div className="flex justify-between"><h2 className="font-bold">{activity.title}</h2><button onClick={onClose}>Close</button></div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {finished?<p>Saved score: {score}. Your attempts have been recorded.</p>:!question?<p>No published questions are available.</p>:<>
      <p>Question {index+1} of {questions.length}</p><h3>{question.question}</h3>
      <form className="space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const saved=await submitStudentArenaAttempt(organizationId,question.id,{submittedAnswer:selected});setResult(saved);setScore(s=>s+saved.score);onSuccess?.();}catch(e){setError(e instanceof Error?e.message:'Attempt could not be saved');}finally{setBusy(false);}}}>
        {question.options.map((option:string,i:number)=><label key={i} className="block border rounded-lg p-3"><input type={question.type==='multiple_choice'?'checkbox':'radio'} name="answer" checked={selected.includes(i)} disabled={!!result||busy} onChange={()=>setSelected(question.type==='multiple_choice'?(selected.includes(i)?selected.filter(v=>v!==i):[...selected,i]):[i])}/> {option}</label>)}
        {!result&&<button disabled={busy||!selected.length}>{busy?'Saving…':'Submit answer'}</button>}
      </form>
      {result&&<div><p>{result.isCorrect?'Correct':'Incorrect'} · {result.score}/{result.maxScore}</p><p>{result.explanation}</p><button onClick={()=>{if(index+1>=questions.length)setFinished(true);else{setIndex(index+1);setSelected([]);setResult(null);}}}>{index+1>=questions.length?'Finish':'Next question'}</button></div>}
    </>}
  </div></div>;
}
