
using ASF.Core.Specification;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace ASF.Core.Repository
{
    public interface IGenericRepository<T> where T : class
    {

        #region StaticRepository
        public Task AddAsync(T entity);
        public Task UpdateAsync(T entity);
        public Task<IReadOnlyCollection<T>> GetAllAsync();
        public Task<T> GetByIdAsync(int id);
        public Task DeleteAsync(T entity);
        public IQueryable<T> GetTableNoTracking();
        #endregion
        public  Task AddRangeAsync(IEnumerable<T> entities);


        #region DynamicRepository
        public Task<IReadOnlyCollection<T>> GetAllWithSpecAsync(ISpecification<T> specification);
        public Task<T> GetByIdWithSpecAsync(ISpecification<T> specification);


        #endregion

    }
}
