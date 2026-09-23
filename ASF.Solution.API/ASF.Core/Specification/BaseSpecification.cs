using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ASF.Core.Specification
{
    public class BaseSpecification<T> : ISpecification<T> where T : class
    {
        public Expression<Func<T, bool>> Critaria { get ; set; }
        public List<Expression<Func<T, object>>> Includes { get; set; } =  new List<Expression<Func<T, object>>>();
        public Expression<Func<T, object>> OrderBy { get; set ; }
        public Expression<Func<T, object>> OrderByDescening { get ; set; }
        public int Take { get ; set; }
        public int Skip { get ; set ; }
        public bool IsPaginatedEnable { get; set ; }

        public BaseSpecification()
        {
                
        }
        public BaseSpecification(Expression<Func<T, bool>> Critaria )
        {
            this.Critaria = Critaria;
        }



        public void AddInclude(Expression<Func<T, object>> includeExpression)
        {
            Includes.Add(includeExpression);
        }

  
        public void AddOrderBy(Expression<Func<T, object>> OrderBy)
        {
            this.OrderBy = OrderBy;
        }
        public void AddOrderByDescening(Expression<Func<T, object>> OrderByDescening)
        {
            this.OrderByDescening = OrderByDescening;
        }
        public void AddPagination(int skip , int take)
        {
            IsPaginatedEnable=true;
            this.Skip = skip;
            this.Take = take;
        }
    }
}
