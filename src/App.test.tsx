import {afterEach,describe,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import App from './App';
import {countries,years,recovery} from './data/model';
import {scenes} from './scenes/story';
afterEach(()=>{cleanup();location.hash=''});
describe('Story acceptance',()=>{
it('walks every scene with Next and returns to start',()=>{render(<App/>);for(let i=0;i<10;i++){expect(screen.getByRole('heading',{level:1})).toHaveTextContent(i===0?'EXPLORE ASEAN':scenes[i].country?countries.find(c=>c.id===scenes[i].country)!.name:scenes[i].title);expect(screen.getByText('DEMO DATA')).toBeVisible();fireEvent.click(screen.getByRole('button',{name:i===9?'Về đầu →':'Next →'}))}expect(screen.getByRole('heading',{level:1})).toHaveTextContent('EXPLORE ASEAN');});
it.each([['Việt Nam','vietnam'],['Indonesia','indonesia'],['Thái Lan','thailand'],['Malaysia','malaysia'],['Singapore · benchmark','singapore']])('maps %s to its intended scene',(name,id)=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:`Mở ${name}`}));expect(location.hash).toBe(`#${id}`)});
it('supports keyboard map selection and direct methodology URL',()=>{render(<App/>);fireEvent.keyDown(screen.getByRole('button',{name:'Mở Việt Nam'}),{key:'Enter'});expect(location.hash).toBe('#vietnam');cleanup();location.hash='#methodology';render(<App/>);expect(screen.getByText('DEMO — chưa có dữ liệu ADB')).toBeVisible()});
it.each([['Việt Nam','vietnam'],['Indonesia','indonesia'],['Thái Lan','thailand'],['Malaysia','malaysia'],['Singapore · benchmark','singapore']])('country shape %s selects correctly',(name,id)=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name}));expect(location.hash).toBe(`#${id}`)});
it('shows fullscreen fallback if browser API is unavailable',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Bật hoặc tắt toàn màn hình'}));expect(await screen.findByRole('status')).toHaveTextContent('F11')});
it('supports arrow navigation without animations',()=>{render(<App/>);fireEvent.keyDown(window,{key:'ArrowRight'});expect(location.hash).toBe('#overview');fireEvent.keyDown(window,{key:'ArrowLeft'});expect(location.hash).toBe('#landing')});
it('has aligned demo series and benchmark labeling',()=>{expect(scenes).toHaveLength(10);countries.forEach(c=>{expect(c.values).toHaveLength(years.length);expect(c.values[0]).toBe(100);expect(recovery(c)).toBe(c.values[5]-100)});expect(countries.find(c=>c.id==='SG')?.name).toContain('benchmark')});
});
